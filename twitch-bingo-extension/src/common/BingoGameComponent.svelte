<script lang="ts">
    import { DefaultEntry, ParseTimespan, type BingoConfirmationNotification, type BingoEntry, type BingoGame, type BingoGrid } from "../EBS/BingoService/EBSBingoTypes";
    import { type Writable } from "svelte/store";
    import { getContext, onMount } from "svelte";
    import { BingoEntryState, BingoPendingResult, type BingoGridCell } from "../model/BingoEntry";
    import { BingoBroadcastEventType, type BingoBroadcastEvent, type BingoConfiguration } from "../model/BingoConfiguration";
    import { BingoEBS } from "../EBS/BingoService/EBSBingoService";
    import { Twitch } from "../services/TwitchService";
    import { TwitchExtHelper } from "./TwitchExtension";
    import { GameContextKey, setGame } from "../stores/game";
    import { GridContextKey, setGrid } from "../stores/grid";
    import type { BingoGameContext } from "./BingoGameContext";
    import type { BingoGridContext } from "./BingoGridContext";

    export let onRefreshGrid: (grid: BingoGrid, cells: BingoGridCell[]) => void = (a,b) => {}
    export let onReceiveGame: (game: BingoGame) => void = (g) => {}
    export let onStop: () => void = () => {}
    export let onSharedIdentity: (isShared:boolean) => void

    const gameContext: Writable<BingoGameContext> = getContext(GameContextKey)
    const gridContext: Writable<BingoGridContext> = getContext(GridContextKey)
    
    let isStarted:boolean = false
    let entries:BingoEntry[] = Array(0)
    let canModerate:boolean = false
    let canVote:boolean = false
    let isAuthorized:boolean = false
    let hasSharedIdentity = false;
    
    Twitch.onAuthorized.push((context) => {
        isAuthorized = true;
        canModerate = TwitchExtHelper.viewer.role == 'broadcaster' || TwitchExtHelper.viewer.role == 'moderator'
        canVote = TwitchExtHelper.viewer.role != 'external'
        hasSharedIdentity = TwitchExtHelper.viewer.isLinked
        if (onSharedIdentity)
        {
            onSharedIdentity(TwitchExtHelper.viewer.isLinked)
        }
        gameContext.update(gc => {
            gc.canModerate = canModerate
            gc.isStarted = isStarted
            gc.canVote = canVote
            gc.isAuthorized = isAuthorized
            gc.hasSharedIdentity = hasSharedIdentity
            gc.requestRefresh = (id: string) => {
                refreshGrid(id, null)
            }
            return gc
        })
    })

    let pendingResults:BingoPendingResult[] = new Array(0)

    gameContext.subscribe(context => {
        if (context.game) onReceiveGame(context.game)
    })
    gridContext.subscribe(context => onRefreshGrid(context.grid, context.grid.cells.map(c => getCell(c.row, c.col)[0])))

    
    function onConfirmationNotification(confirmation: BingoConfirmationNotification) {
        // console.log(confirmation)
        entries = entries.map(entry => {
                if (entry.key === confirmation.key)
                {
                    return {
                        key: confirmation.key,
                        text: entry.text,
                        confirmedAt: confirmation.confirmationTime,
                        confirmedBy: confirmation.confirmedBy,
                    }
                }
                return entry
            })
        pendingResults = pendingResults.filter(p => p.key != confirmation.key)
        if ($gameContext.game)
        {
            refreshGrid($gameContext.game.gameId, entries)
        }
    }
    
    function receiveBroadcast(_target: any, _contentType: any, messageStr: string) {
        console.log(`Received broadcast: ${messageStr}`)
        let message: BingoBroadcastEvent = JSON.parse(messageStr);
        switch (message.type) {
            case BingoBroadcastEventType.SetConfig:
                let config: BingoConfiguration = message.payload
                if (config.activeGame)
                {
                    gameContext.update(gc => {
                        gc.game = config.activeGame
                        return gc
                    })
                }
                onLoadConfig(config)
                break;
            case BingoBroadcastEventType.Start:
                onStart(message.payload);
                break;
            case BingoBroadcastEventType.Bingo:
                if ($gameContext.game)
                {
                    refreshGrid($gameContext.game.gameId, null);
                }
                break;
            case BingoBroadcastEventType.Stop:
                pendingResults = new Array(0)
                entries = new Array(0)
                gameContext.update(gc => {
                    gc.game = undefined
                    return gc
                })
                console.log("Stopped game");
                if (onStop)
                {
                    onStop()
                }
                break;
            case BingoBroadcastEventType.Confirm:
                onConfirmationNotification(message.payload)
                break;
            default:
                break;
        }
    }

    onMount(() => {
        TwitchExtHelper.listen('broadcast', receiveBroadcast);
        return () => {
            TwitchExtHelper.unlisten('broadcast', receiveBroadcast)
        }
    })


    const onStart = (payload: BingoGame) => {
        refreshGrid(payload.gameId, payload.entries)
        gameContext.update(gc => {
            gc.isStarted = true
            gc.onTentative = onTentative
            return gc
        })
        isStarted = true
    }

    const refreshGrid = (gameId: string, refreshEntries: BingoEntry[] | null) => {
        if (! gameId)
        {
            console.error("No game provided to refreshGrid")
            return
        }
        if (! isAuthorized)
        {
            console.error("Unidentified user, aborting refresh")
            return
        }
        BingoEBS.getGrid(gameId).then(grid => {
            console.log(`Refreshing grid.`)
            if (refreshEntries)
            {
                console.log(`Refreshing entries: ${JSON.stringify(refreshEntries)}`)
                entries = refreshEntries
            }
            setGrid(gridContext, grid)
        }).catch(error => {
            console.error("Error loading grid from EBS: " + error);
        });
        refreshGame(gameId)
    }

    const refreshGame = (gameId: string) => {
        if ($gameContext.canModerate)
        {
            BingoEBS.getGame(gameId).then(refreshedGame => {
                console.log("Refreshed game for moderation")
                setGame(gameContext, refreshedGame)
            }).catch(error => {
                console.error("Error loading game from EBS: " + error);
            });
        }
    }

    const loadConfig = (_broadcasterConfig: any) => {
        var extensionConfig = Twitch.configuration;
        if (! extensionConfig?.content)
        {
            return;
        }
        var configContent: BingoConfiguration = JSON.parse(extensionConfig.content);
        onLoadConfig(configContent)
    }

    Twitch.onConfiguration.push(loadConfig)

    let onLoadConfig = (configContent: BingoConfiguration) => {
        const activeGameId:string = configContent.activeGameId ?? configContent.activeGame?.gameId ?? ""
        if ($gameContext.game?.gameId !== activeGameId)
        {
            BingoEBS.getGame(activeGameId)
                .then(game => {
                    setGame(gameContext, game)
                    onStart(game)
                    if (onReceiveGame)
                    {
                        onReceiveGame(game)
                    }
                })
                .catch(error => {
                    console.log(`Error fetching game ${activeGameId}: ${JSON.stringify(error)}`)
                })
        }
    }

    const getCell = (row: number, col: number):[BingoGridCell,BingoEntry] => {
        var cellResult = $gridContext.grid.cells.filter(c => c.row === row && c.col === col);
        if (cellResult.length == 1)
        {
            var cell = cellResult[0];
            var entryResult = entries.filter(e => e.key === cell.key);
            if (entryResult.length == 1)
            {
                var entry = entryResult[0];
                var pending: BingoPendingResult | undefined = pendingResults.find(p => p.key == cell.key);
                return [
                    {
                        row: row,
                        col: col,
                        key: entry.key,
                        text: entry.text,
                        state: cell.state,
                        timer: pending?.expireAt ?? null,
                    },
                    entry
                ];
            }
            else
            {
                console.error(`Error fetching cell entry #${cell.key} at (r${row},c${col}), result: ${JSON.stringify(entryResult)}`)
                console.error(`Entries : ${JSON.stringify(entries)}`)
            }
        }
        else
        {
            console.error(`Error fetching cell at (r${row},c${col}), result: ${JSON.stringify(cellResult)}`)
        }
        return [
            {
                row: row,
                col: col,
                key: -(col + (row * $gridContext.grid.cols)) - 1,
                text: "",
                state: BingoEntryState.Idle,
                timer: null,
            },
            DefaultEntry
        ]
    }

    const onTentativeRefresh = (entry: BingoEntry) => {
        console.log(`onTentative, refreshing grid after timeout ${entries.length}`);
        
        pendingResults = pendingResults.filter(p => p.key != entry.key)
        refreshGrid($gameContext.game!.gameId, null);
    }
    
    const onTentative = (entry: BingoEntry) => {  
        if ($gameContext.game)
        {
            BingoEBS.tentative($gameContext.game.gameId, entry.key.toString());
            var cellIndex = $gridContext.grid.cells.findIndex(c => c.key == entry.key);
            $gridContext.grid.cells[cellIndex].state = BingoEntryState.Pending;
            var pendingResultsRefreshed:BingoPendingResult[] = pendingResults.filter(p => p.key != entry.key);

            var confirmationTimeout = ParseTimespan($gameContext.game.confirmationThreshold) + 500

            pendingResultsRefreshed.push({
                key: entry.key,
                expireAt: new Date(Date.now() + confirmationTimeout),
            });
            pendingResults = pendingResultsRefreshed
            setTimeout(() => onTentativeRefresh(entry), confirmationTimeout);
            console.log(`onTentative, updated cell state, set countdown to ${pendingResultsRefreshed[pendingResultsRefreshed.length - 1].expireAt} - ${entries.length}`);

            setGrid(gridContext, $gridContext.grid)
        }
    }

    gameContext.update(gc => {
        gc.promptIdentity = (): void => {
            console.log("Prompting identity")
            TwitchExtHelper.actions.requestIdShare()
        }
        return gc
    })

    gridContext.update(gc => {
        gc.getCell = getCell
        return gc
    })

</script>

<slot></slot>