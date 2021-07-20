import LinearProgress from '@material-ui/core/LinearProgress';
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
    moderationDrawerOpen: boolean,
}

export type ViewerBingoComponentBaseProps = {
    onReceiveGame?: (game: BingoGame) => void,
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
        moderationDrawerOpen: false,
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
                        isStarted: message.payload.activeGame != null,
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
                    this.refreshGrid(this.state.activeGame, this.state.entries);
                    break;
                case 'stop':
                    this.setState({
                        entries: new Array(0),
                        isStarted: false,
                        rows: 0,
                        columns: 0,
                        activeGame: null,
                        pendingResults: new Array(0),
                        moderationDrawerOpen: false,
                    });
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

    onStart(payload: BingoGame) {
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
                rows: game.rows,
                columns: game.columns,
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
            if (this.props.onReceiveGame)
            {
                this.props.onReceiveGame(configContent.activeGame);
            }
        }
    };
    
    getCellFontSize(_cell: BingoGridCell): string
    {
        var state = this.state as ViewerBingoComponentBaseState;
        var numberOfCells = state.columns * state.rows;

        // Function to get a vw unit font-size based on number of cells
        //  used these points for plotting: (6, 2.5vw), (12, 1.6vw), (16, 1.35vw), (20, 1.2vw)
        //  used https://mycurvefit.com/
        var fontSize = 0.7081993 + (6.028139 - 0.7081993)/(1 + Math.pow(numberOfCells/3.611081, 1.33441))

        return fontSize.toFixed(2) + "vw";
    }

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
                // console.log("Pending result for key " + cell.key + " : " + pending?.key +  " expires at " + pending?.expireAt);
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

        var confirmationTimeout = (ParseTimespan((this.state as ViewerBingoComponentBaseState).activeGame.confirmationThreshold) + 1);

        pendingResults.push({
            key: entry.key,
            expireAt: new Date(Date.now() + confirmationTimeout),
        });
        this.setState({
            grid: grid,
            pendingResults: pendingResults,
        });
        setTimeout(() => {
            // console.log("onTentative, refreshing grid after timeout");
            var pendingResults:BingoPendingResult[] = this.state.pendingResults.filter(p => p.key != entry.key);
            this.setState({
                pendingResults: pendingResults
            });
            this.refreshGrid(this.state.activeGame, this.state.entries);
        }, confirmationTimeout);
        // console.log("onTentative, updated cell state, set countdown to " + pendingResults[pendingResults.length - 1].expireAt);
    };

    renderGrid(){
        return (
            <div className="bingoGrid">
                {
                    [...Array(this.state.rows).keys()].map(row => {
                        let isRowComplete = this.isRowComplete(row);
                        return [...Array(this.state.columns).keys()].map(col => {
                            let isColComplete = this.isColComplete(col);
                            let [cell, entry] = this.getCell(row, col);
                            if (! entry)
                            {
                                var key = this.state.nextKey + col + (row * this.state.columns);
                                return <div key={key} style={{gridColumn: col + 1, gridRow: row + 1}}>
                                    <BingoViewerEntry
                                        config={{key: key, text: ""}}
                                        state={BingoEntryState.Idle}
                                        canInteract={false}
                                        canConfirm={false}
                                        isColCompleted={isColComplete}
                                        isRowCompleted={isRowComplete}
                                        onTentative={this.onTentative}
                                        fontSize="16px"
                                    />
                                </div>
                            }
                            else
                            {
                                return <div key={cell.key} style={{gridColumn: col + 1, gridRow: row + 1}}>
                                    <BingoViewerEntry
                                        config={entry}
                                        state={cell.state}
                                        canInteract={this.state.canVote && cell.state == BingoEntryState.Idle}
                                        canConfirm={this.state.canModerate}
                                        isColCompleted={isColComplete}
                                        isRowCompleted={isRowComplete}
                                        countdown={cell.timer}
                                        onTentative={this.onTentative}
                                        fontSize={this.getCellFontSize(cell)}
                                    />
                                </div>
                            }
                        })
                    })
                }
            </div>);
    }

    render(){
        return [
            <React.Fragment>
            {
                this.state.isStarted
                    ? this.renderGrid()
                    : <div style={
                            {
                                backgroundColor:'rgba(245,245,245, 0.8)',
                                width: '100%',
                                textAlign: 'center',
                                paddingTop: '1vw',
                                paddingBottom: '1vw',
                                borderRadius: '0.25vw',
                            }}>
                        <LinearProgress style={{marginBottom: '1vw', marginTop: '1vw'}} />
                        Waiting for the game to start !
                    </div>
            }
            </React.Fragment>
        ]
    }
}