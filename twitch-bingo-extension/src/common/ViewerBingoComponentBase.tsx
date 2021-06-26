import { Box, Grid, LinearProgress, Paper, Typography } from '@material-ui/core';
import * as React from 'react';
import { TwitchExtHelper } from './TwitchExtension';
import { BingoEntryState, BingoGridCell, BingoPendingResult } from '../model/BingoEntry';
import BingoViewerEntry from './BingoViewerEntry';
import { BingoEBS } from '../EBS/BingoService/EBSBingoService';
import { Twitch } from '../services/TwitchService';
import { BingoEntry, BingoGame, BingoGrid, ParseTimespan } from '../EBS/BingoService/EBSBingoTypes';

export type ViewerBingoComponentBaseState = {
    entries: BingoEntry[],
    rows: number,
    columns: number,
    isStarted: boolean,
    canModerate: boolean,
    canVote: boolean,
    gameId?: string,
    activeGame?: BingoGame,
    grid?: BingoGrid,
    pendingResults: BingoPendingResult[],
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
        pendingResults: new Array(0),
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
                        activeGame: message.payload.activeGame,
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

    onStart = (payload: BingoGame) => {
        console.log("Received start for game:" + payload.gameId);
        this.refreshGrid(payload, payload.entries);
    };

    refreshGrid = (game: BingoGame, entries: BingoEntry[]) => {
        BingoEBS.getGrid(game.gameId).then(grid => {
            this.setState({
                gameId: game.gameId,
                entries: entries,
                grid: grid,
                isStarted: true,
                activeGame: game,
            });
        }).catch(error => {
            console.error("Error loading grid from EBS: " + error);
        });
    }

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
            columns: configContent?.columns ?? 3,
            activeGame: configContent?.activeGame,
        });
        if (configContent?.activeGame)
        {
            this.onStart(configContent.activeGame);
        }
    };

    getCell = (row: number, col: number): [BingoGridCell,BingoEntry] => {
        var state = this.state as ViewerBingoComponentBaseState;

        var cellResult = state.grid.cells.filter(c => c.row == row && c.col == col);
        if (cellResult.length == 1)
        {
            var cell = cellResult[0];
            var entryResult = state.entries.filter(e => e.key == cell.key);
            if (entryResult.length == 1)
            {
                var entry = entryResult[0];
                var pending: BingoPendingResult = state.pendingResults.find(p => p.key == cell.key);
                console.log("Pending result for key " + cell.key + " : " + pending);
                return [
                    {
                        row: row,
                        col: col,
                        key: entry.key,
                        text: entry.text,
                        state: cell.state,
                        timer: pending?.expireAt,
                    },
                    entry
                ];
            }
        }
        return [
            {
                row: row,
                col: col,
                key: -(col + (row * state.columns)) - 1,
                text: "",
                state: BingoEntryState.Idle,
                timer: null,
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
        var grid: BingoGrid = this.state.grid;
        var cellIndex = grid.cells.findIndex(c => c.key == entry.key);
        grid.cells[cellIndex].state = BingoEntryState.Pending;
        var pendingResults:BingoPendingResult[] = this.state.pendingResults.filter(p => p.key != entry.key);

        var confirmationTimeout = ParseTimespan((this.state as ViewerBingoComponentBaseState).activeGame.confirmationThreshold) + 1;

        pendingResults.push({
            key: entry.key,
            expireAt: new Date(Date.now() + confirmationTimeout),
        });
        this.setState({
            grid: grid,
            pendingResults: pendingResults,
        });
        setTimeout(() => {
            console.log("onTentative, refreshing grid after timeout");
            var pendingResults:BingoPendingResult[] = this.state.pendingResults.filter(p => p.key != entry.key);
            this.setState({
                pendingResults: pendingResults
            });
            this.refreshGrid(this.state.gameId, this.state.entries);
        }, confirmationTimeout*1000);
        console.log("onTentative, updated cell state, set countdown to " + pendingResults[pendingResults.length - 1].expireAt);
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
                                        var key = this.state.nextKey + col + (row * this.state.columns);
                                        return <Grid item xs key={key}>
                                            <BingoViewerEntry
                                                config={{key: key, text: ""}}
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
                                                canInteract={this.state.canVote && cell.state == BingoEntryState.Idle}
                                                canConfirm={this.state.canModerate}
                                                isColCompleted={isColComplete}
                                                isRowCompleted={isRowComplete}
                                                countdown={cell.timer}
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