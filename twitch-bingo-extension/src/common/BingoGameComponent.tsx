import * as React from 'react';
import { TwitchExtHelper } from './TwitchExtension';
import { BingoEntryState, BingoGridCell, BingoPendingResult } from '../model/BingoEntry';
import { BingoEBS } from '../EBS/BingoService/EBSBingoService';
import { Twitch } from '../services/TwitchService';
import { BingoConfirmationNotification, BingoEntry, BingoGame, BingoGrid, ParseTimespan } from '../EBS/BingoService/EBSBingoTypes';
import { BingoGameContext } from './BingoGameContext';
import { BingoGridContext } from './BingoGridContext';

export const ActiveGameContext = React.createContext<BingoGameContext>(null)
export const ActiveGridContext = React.createContext<BingoGridContext>(null)

type BingoGameComponentProps = {
    children?: React.ReactNode,
    onRefreshGrid?: (grid: BingoGrid, cells: BingoGridCell[]) => void,
    onReceiveGame?: (game: BingoGame) => void,
    onStop?: () => void,
}

export default function BingoGameComponent(props: BingoGameComponentProps) {
    const [entries, setEntries] = React.useState<BingoEntry[]>(new Array(0))
    const [canModerate, setCanModerate] = React.useState(false)
    const [canVote, setCanVote] = React.useState(false)
    const [pendingResults, setPendingResults] = React.useState<BingoPendingResult[]>(new Array(0))
    const [gameId, setGameId] = React.useState<string>(null)
    const [activeGame, setActiveGame] = React.useState<BingoGame>(null)
    const [isStarted, setStarted] = React.useState(false)
    const [grid, setGrid] = React.useState<BingoGrid>(null)

    const loadConfig = (_broadcasterConfig: any) => {
        var extensionConfig = Twitch.configuration;
        if (! extensionConfig)
        {
            return;
        }
        var configContent = JSON.parse(extensionConfig.content);
        setEntries(configContent?.entries ?? new Array(0))
        setActiveGame(configContent?.activeGame)
        if (configContent?.activeGame)
        {
            onStart(configContent.activeGame);
            if (props.onReceiveGame)
            {
                props.onReceiveGame(configContent.activeGame);
            }
        }
    };

    React.useEffect(() => {
        Twitch.onConfiguration.push(loadConfig);
        return () => {
            var index = Twitch.onConfiguration.indexOf(loadConfig)
            if (index !== -1)
            {
                Twitch.onConfiguration.splice(index, 1)
            }
        }
    }, [])

    const receiveBroadcast = React.useCallback((_target, _contentType, messageStr) => {
        let message = JSON.parse(messageStr);
        switch (message.type) {
            case 'set-config':
                setEntries(message.payload.entries)
                setActiveGame(message.payload.activeGame)
                console.log(message.payload.activeGame);
                break;
            case 'start':
                onStart(message.payload);
                break;
            case 'bingo':
                refreshGrid(activeGame, entries);
                break;
            case 'stop':
                setEntries(new Array(0))
                setActiveGame(null)
                console.log("Stopped game");
                setPendingResults(new Array(0))
                if (props.onStop)
                {
                    props.onStop()
                }
                break;
            case 'confirm':
                onConfirmationNotification(message.payload)
                break;
            default:
                break;
        }
    }, [activeGame, entries])

    React.useEffect(() => {
        TwitchExtHelper.listen('broadcast', receiveBroadcast);
        return () => {
            TwitchExtHelper.unlisten('broadcast', receiveBroadcast)
        }
    }, [activeGame])

    const onAuthorized = (_context) => {
        setCanModerate(TwitchExtHelper.viewer.role == 'broadcaster' || TwitchExtHelper.viewer.role == 'moderator')
        setCanVote(TwitchExtHelper.viewer.role != 'external')
    }

    React.useEffect(() => {
        Twitch.onAuthorized.push(onAuthorized)
        return () => {
            var index = Twitch.onAuthorized.findIndex(onAuthorized)
            if (index !== -1)
            {
                Twitch.onAuthorized.splice(index, 1)
            }
        }
    }, [])

    const refreshGrid = (game: BingoGame, entries: BingoEntry[]) => {
        if (! game)
        {
            console.error("No game provided to refreshGrid")
            return
        }
        BingoEBS.getGrid(game.gameId).then(grid => {
            setGameId(game.gameId)
            setEntries(entries)
            setGrid(grid)
            setActiveGame(game)
        }).catch(error => {
            console.error("Error loading grid from EBS: " + error);
        });
    }

    React.useEffect(() => {
        if (grid && props.onRefreshGrid) props.onRefreshGrid(grid, grid.cells.map(c => getCell(c.row, c.col)[0]))
    }, [grid])

    const onStart = (payload: BingoGame) => {
        console.log("Received start for game:" + payload.gameId);
        refreshGrid(payload, payload.entries);
        setStarted(true)
    };

    const onTentativeRefresh = React.useCallback((entry: BingoEntry) => {
        console.log("onTentative, refreshing grid after timeout");
        setPendingResults(pendingResults.filter(p => p.key != entry.key))
        refreshGrid(activeGame, entries);
    }, [activeGame, entries, pendingResults])

    const onTentative = React.useCallback((entry: BingoEntry) => {  
        BingoEBS.tentative(gameId, entry.key.toString());
        var cellIndex = grid.cells.findIndex(c => c.key == entry.key);
        grid.cells[cellIndex].state = BingoEntryState.Pending;
        var pendingResultsRefreshed:BingoPendingResult[] = pendingResults.filter(p => p.key != entry.key);

        var confirmationTimeout = ParseTimespan(activeGame.confirmationThreshold) + 500

        pendingResultsRefreshed.push({
            key: entry.key,
            expireAt: new Date(Date.now() + confirmationTimeout),
        });
        setGrid(grid)
        setPendingResults(pendingResultsRefreshed)

        setTimeout(() => onTentativeRefresh(entry), confirmationTimeout);
        console.log("onTentative, updated cell state, set countdown to " + pendingResultsRefreshed[pendingResultsRefreshed.length - 1].expireAt);
    }, [gameId, grid, pendingResults, activeGame, entries]);

    const getCell = React.useCallback((row: number, col: number): [BingoGridCell,BingoEntry] => {
        var cellResult = grid.cells.filter(c => c.row == row && c.col == col);
        if (cellResult.length == 1)
        {
            var cell = cellResult[0];
            var entryResult = entries.filter(e => e.key == cell.key);
            if (entryResult.length == 1)
            {
                var entry = entryResult[0];
                var pending: BingoPendingResult = pendingResults.find(p => p.key == cell.key);
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
                key: -(col + (row * grid.cols)) - 1,
                text: "",
                state: BingoEntryState.Idle,
                timer: null,
            },
            null
        ];
    }, [grid, entries, pendingResults]);

    const isColComplete = React.useCallback((col: number): boolean =>
    {
        return grid.cells.filter(c => c.col == col).every(c => c.state == BingoEntryState.Confirmed);
    }, [grid])

    const isRowComplete = React.useCallback((row: number): boolean => {
        return grid.cells.filter(c => c.row == row).every(c => c.state == BingoEntryState.Confirmed);
    }, [grid])
    
    const onConfirmationNotification = React.useCallback((confirmation: BingoConfirmationNotification) => {
        console.log(confirmation)
        setEntries(entries.map(entry => {
            if (entry.key == confirmation.key)
            {
                return {
                    key: confirmation.key,
                    text: entry.text,
                    confirmedAt: confirmation.confirmationTime,
                    confirmedBy: confirmation.confirmedBy,
                }
            }
            return entry
        }))
    }, [entries])

    return (
        <ActiveGameContext.Provider value={
                {
                    isStarted: isStarted,
                    game: activeGame,
                    onTentative: onTentative,
                    canModerate: canModerate,
                    canVote: canVote
                }
            }>
            <ActiveGridContext.Provider value={
                    {
                        grid: grid,
                        getCell: getCell,
                        isColComplete: isColComplete,
                        isRowComplete: isRowComplete
                    }
                }>
                { props.children }
            </ActiveGridContext.Provider>
        </ActiveGameContext.Provider>
    )
}