import { Box, Grid, LinearProgress, Paper, Typography } from '@material-ui/core';
import * as React from 'react';
import { TwitchExtHelper } from './TwitchExtension';
import { BingoEntry, BingoEntryState, BingoGridCell } from '../model/BingoEntry';
import BingoViewerEntry from './BingoViewerEntry';
import { BingoEBS } from '../EBS/BingoService/EBSBingoService';
import { Twitch } from '../services/TwitchService';
import { BingoGrid } from '../EBS/BingoService/EBSBingoTypes';

export type ViewerBingoComponentBaseState = {
    entries: BingoEntry[],
    rows: number,
    columns: number,
    isStarted: boolean,
    canModerate: boolean,
    canVote: boolean,
    gameId?: string,
    grid?: BingoGrid,
}

export type ViewerBingoComponentBaseProps = {
}

export default class ViewerBingoComponentBase<PropType extends ViewerBingoComponentBaseProps, StateType extends ViewerBingoComponentBaseState> extends React.Component<PropType & ViewerBingoComponentBaseProps, StateType & ViewerBingoComponentBaseState> {
    state: any = {
        entries: new Array(0),
        rows: 0,
        columns: 0,
        isStarted: false,
        canModerate: false,
        canVote: false,
    };

    constructor(props: PropType){
        super(props)
    }

    componentDidMount() {
        Twitch.onConfiguration.push(this.loadConfig);
        TwitchExtHelper.listen('broadcast', (_target, _contentType, messageStr) => {
            let message = JSON.parse(messageStr);
            switch (message.type) {
                case 'set-config':
                    this.setState({
                        entries: message.payload.entries,
                        rows: message.payload.rows,
                        columns: message.payload.columns,
                    });
                    break;
                case 'start':
                    this.onStart(message.payload);
                    break;
                case 'bingo':
                    console.log(messageStr);
                    break;
                default:
                    break;
            }
        });
        Twitch.onAuthorized.push(_context => {
            this.setState({
                canModerate: TwitchExtHelper.viewer.role == 'broadcaster' || TwitchExtHelper.viewer.role == 'moderator',
                canVote: TwitchExtHelper.viewer.role != 'external',
            });
        });
    };

    onStart = (payload: any) => {
        console.log("Received start for game:" + payload.gameId);

        BingoEBS.getGrid(payload.gameId).then(grid => {
            
            this.setState({
                gameId: payload.gameId,
                entries: payload.entries,
                grid: grid,
                isStarted: true,
            });
        }).catch(error => {
            console.error("Error loading grid from EBS: " + error);
        });
    };

    loadConfig = (_broadcasterConfig: any) => {
        var extensionConfig = Twitch.configuration;
        if (! extensionConfig)
        {
            return;
        }
        var configContent = JSON.parse(extensionConfig.content);
        this.setState({
            entries: configContent?.entries ?? new Array(0),
            rows: configContent?.rows ?? 3,
            columns: configContent?.columns ?? 3
        });
        if (configContent?.activeGame)
        {
            this.onStart(configContent.activeGame);
        }
    };

    getCell = (row: number, col: number): [BingoGridCell,BingoEntry] => {
        var cellResult = this.state.grid.cells.filter(c => c.row == row && c.col == col);
        if (cellResult.length == 1)
        {
            var cell = cellResult[0];
            var entryResult = this.state.entries.filter(e => e.key == cell.key);
            if (entryResult.length == 1)
            {
                var entry = entryResult[0];
                return [
                    {
                        row: row,
                        col: col,
                        key: entry.key,
                        text: entry.text,
                        state: cell.state,
                    },
                    entry
                ];
            }
        }
        return [
            {
                row: row,
                col: col,
                key: -(col + (row * this.state.columns)) - 1,
                text: "",
                state: BingoEntryState.Idle,
            },
            null
        ];
    };

    isColComplete = (col: number): boolean => {
        return this.state.grid.cells.filter(c => c.col == col).every(c => c.state == BingoEntryState.Confirmed);
    }

    isRowComplete = (row: number): boolean => {
        return this.state.grid.cells.filter(c => c.row == row).every(c => c.state == BingoEntryState.Confirmed);
    }

    onTentative = (entry: BingoEntry) => {  
        BingoEBS.tentative(this.state.gameId, entry.key.toString());
    };

    onConfirm = (entry: BingoEntry) => {
        BingoEBS.confirm(this.state.gameId, entry.key.toString());
    };

    renderGrid(){
        return (
            <Grid container className="bingoGrid">
                {
                    [...Array(this.state.rows).keys()].map(row => {
                        let isRowComplete = this.isRowComplete(row);
                        return <Grid container item xs={12} spacing={1} key={row}>
                            {
                                [...Array(this.state.columns).keys()].map(col => {
                                    let isColComplete = this.isColComplete(col);
                                    let [cell, entry] = this.getCell(row, col);
                                    if (! entry)
                                    {
                                        return <Grid item xs key={this.state.nextKey + col + (row * this.state.columns)}>
                                            <BingoViewerEntry
                                                config={new BingoEntry()}
                                                state={BingoEntryState.Idle}
                                                canInteract={false}
                                                canConfirm={false}
                                                isColCompleted={isColComplete}
                                                isRowCompleted={isRowComplete}
                                                onTentative={this.onTentative}
                                                onConfirm={this.onConfirm}
                                            />
                                        </Grid>
                                    }
                                    else
                                    {
                                        return <Grid item xs key={cell.key}>
                                            <BingoViewerEntry
                                                config={entry}
                                                state={cell.state}
                                                canInteract={this.state.canVote}
                                                canConfirm={this.state.canModerate}
                                                isColCompleted={isColComplete}
                                                isRowCompleted={isRowComplete}
                                                onTentative={this.onTentative}
                                                onConfirm={this.onConfirm}
                                            />
                                        </Grid>
                                    }
                                })
                            }
                        </Grid>
                    })
                }
            </Grid>);
    }

    render(){
        return [
            <Paper>
                <Typography>{this.state.canModerate ? "Moderator" : (this.state.canVote ? "Player" : "Lurker")}</Typography>
            </Paper>,
            <Box my={12} mx={2}>
            {
                this.state.isStarted ? this.renderGrid() : <Paper><LinearProgress /></Paper>
            }
            </Box>
        ]
    }
}