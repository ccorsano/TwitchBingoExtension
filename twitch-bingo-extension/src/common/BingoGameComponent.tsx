import * as React from 'react';
import { TwitchExtHelper } from './TwitchExtension';
import { BingoEntryState, BingoGridCell, BingoPendingResult } from '../model/BingoEntry';
import { BingoEBS } from '../EBS/BingoService/EBSBingoService';
import { Twitch } from '../services/TwitchService';
import { BingoConfirmationNotification, BingoEntry, BingoGame, BingoGrid, ParseTimespan } from '../EBS/BingoService/EBSBingoTypes';
import { BingoGameContext } from './BingoGameContext';
import { BingoGridContext } from './BingoGridContext';
import { BingoBroadcastEvent, BingoBroadcastEventType, BingoConfiguration } from '../model/BingoConfiguration';

export const ActiveGameContext = React.createContext<BingoGameContext>(null)
export const ActiveGridContext = React.createContext<BingoGridContext>(null)

type BingoGameComponentProps = {
    children?: React.ReactNode,
    onRefreshGrid?: (grid: BingoGrid, cells: BingoGridCell[]) => void,
    onReceiveGame?: (game: BingoGame) => void,
    onStop?: () => void,
    onSharedIdentity?: (isShared: boolean) => void,
}

export default function BingoGameComponent(props: BingoGameComponentProps) {
    const [entries, setEntries] = React.useState<BingoEntry[]>(new Array(0))
    const [canModerate, setCanModerate] = React.useState(false)
    const [canVote, setCanVote] = React.useState(false)
    const [pendingResults, setPendingResults] = React.useState<BingoPendingResult[]>(new Array(0))
    const [activeGame, setActiveGame] = React.useState<BingoGame>(null)
    const [isStarted, setStarted] = React.useState(false)
    const [grid, setGrid] = React.useState<BingoGrid>(null)
    const [hasSharedIdentity, setSharedIdentity] = React.useState(false)
    const [isAuthorized, setAuthorized] = React.useState(false)

    const onLoadConfig = React.useCallback((configContent: BingoConfiguration) => {
        setEntries(configContent.entries ?? new Array(0))
        const activeGameId: string = configContent.activeGameId ?? configContent.activeGame?.gameId
        if (activeGame?.gameId !== activeGameId)
        {
            BingoEBS.getGame(activeGameId)
                .then(game => {
                    setActiveGame(game)
                    onStart(game)
                    if (props.onReceiveGame)
                    {
                        props.onReceiveGame(configContent.activeGame);
                    }
                })
                .catch(error => {
                    console.log(`Error fetching game ${activeGameId}: ${error}`)
                })
        }
    }, [activeGame])

    const loadConfig = (_broadcasterConfig: any) => {
        var extensionConfig = Twitch.configuration;
        if (! extensionConfig?.content)
        {
            return;
        }
        var configContent: BingoConfiguration = JSON.parse(extensionConfig.content);
        onLoadConfig(configContent)
    }

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
        let message: BingoBroadcastEvent = JSON.parse(messageStr);
        switch (message.type) {
            case BingoBroadcastEventType.SetConfig:
                let config: BingoConfiguration = message.payload
                if (config.activeGame)
                {
                    setActiveGame(message.payload.activeGame)
                    console.log(config.activeGame);
                }
                onLoadConfig(config)
                break;
            case BingoBroadcastEventType.Start:
                setActiveGame(message.payload)
                onStart(message.payload);
                break;
            case BingoBroadcastEventType.Bingo:
                refreshGrid(activeGame, entries);
                break;
            case BingoBroadcastEventType.Stop:
                setPendingResults(new Array(0))
                setGrid(null)
                setEntries(new Array(0))
                setActiveGame(null)
                console.log("Stopped game");
                if (props.onStop)
                {
                    props.onStop()
                }
                break;
            case BingoBroadcastEventType.Confirm:
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

    const onAuthorized = React.useCallback((_context) => {
        setCanModerate(TwitchExtHelper.viewer.role == 'broadcaster' || TwitchExtHelper.viewer.role == 'moderator')
        setCanVote(TwitchExtHelper.viewer.role != 'external')
        setSharedIdentity(TwitchExtHelper.viewer.isLinked)
        setAuthorized(true)
        if (activeGame)
        {
            refreshGame(activeGame)
        }
        if (props.onSharedIdentity)
        {
            props.onSharedIdentity(TwitchExtHelper.viewer.isLinked)
        }
    }, [activeGame])

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

    React.useEffect(() => {
        if (canModerate && activeGame)
        {
            refreshGame(activeGame)
        }
    }, [canModerate])

    const refreshGame = React.useCallback((game: BingoGame) => {
        if (canModerate)
        {
            BingoEBS.getGame(game.gameId).then(refreshedGame => {
                console.log("Refreshed game for moderation")
                setActiveGame(refreshedGame)
            }).catch(error => {
                console.error("Error loading game from EBS: " + error);
            });
        }
    }, [canModerate])

    const refreshGrid = (game: BingoGame, entries: BingoEntry[]) => {
        if (! game)
        {
            console.error("No game provided to refreshGrid")
            return
        }
        BingoEBS.getGrid(game.gameId).then(grid => {
            setEntries(entries)
            setGrid(grid)
        }).catch(error => {
            console.error("Error loading grid from EBS: " + error);
        });
        setActiveGame(game)
        refreshGame(game)
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
        BingoEBS.tentative(activeGame.gameId, entry.key.toString());
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
    }, [grid, pendingResults, activeGame, entries]);

    if (props.onRefreshGrid)
    {
        React.useEffect(() => {
            if (grid?.cells)
            {
                props.onRefreshGrid(grid, grid.cells.map(c => getCell(c.row, c.col)[0]))
            }
        }, [grid, pendingResults])
    }

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

    const promptIdentity = (): void => {
        console.log("Prompting identity")
        TwitchExtHelper.actions.requestIdShare()
    }

    return (
        <ActiveGameContext.Provider value={
                {
                    isAuthorized: isAuthorized,
                    isStarted: isStarted,
                    hasSharedIdentity: hasSharedIdentity,
                    promptIdentity: promptIdentity,
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