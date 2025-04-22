<script lang="ts">
    import type { BingoEntry, BingoGame, BingoGrid } from "../EBS/BingoService/EBSBingoTypes";
    import { readable, writable } from "svelte/store";
    import { setContext } from "svelte";
    import { BingoEntryState, BingoPendingResult, type BingoGridCell } from "../model/BingoEntry";
    import type { BingoConfiguration } from "../model/BingoConfiguration";
    import { BingoEBS } from "../EBS/BingoService/EBSBingoService";
    import { Twitch } from "../services/TwitchService";

    export let onRefreshGrid: (grid: BingoGrid, cells: BingoGridCell[]) => void = (a,b) => {}
    export let onReceiveGame: (game: BingoGame) => void = (g) => {}
    export let onStop: () => void = () => {}
    export let onSharedIdentity: (isShared:boolean) => void

    let isStarted:boolean = false
    let entries:BingoEntry[] = Array(0)
    let canModerate:boolean = false
    let isAuthorized:boolean = false
    
    Twitch.onAuthorized.push((context) => {
        isAuthorized = true;
    })

    let activeGame = writable<BingoGame>(undefined)
    setContext("game", activeGame)
    let activeGrid = writable<BingoGrid>(undefined)
    setContext("grid", activeGrid)
    let pendingResults:BingoPendingResult[] = new Array(0)

    activeGrid.subscribe(grid => onRefreshGrid(grid, grid?.cells?.map(c => getCell(c.row, c.col)[0])))

    const onStart = (payload: BingoGame) => {
        refreshGrid(payload, payload.entries)
        isStarted = true
    }

    const refreshGrid = (game: BingoGame, refreshEntries: BingoEntry[]) => {
        if (! game)
        {
            console.error("No game provided to refreshGrid")
            return
        }
        if (! isAuthorized)
        {
            console.error("Unidentified user, aborting refresh")
            return
        }
        BingoEBS.getGrid(game.gameId).then(grid => {
            console.log(`Refreshing grid.`)
            if (refreshEntries)
            {
                console.log(`Refreshing entries: ${JSON.stringify(refreshEntries)}`)
                entries = refreshEntries
            }
            activeGrid.set(grid)
        }).catch(error => {
            console.error("Error loading grid from EBS: " + error);
        });
        activeGame.set(game)
        refreshGame(game)
    }

    const refreshGame = (game: BingoGame) => {
        if (canModerate)
        {
            BingoEBS.getGame(game.gameId).then(refreshedGame => {
                console.log("Refreshed game for moderation")
                activeGame.set(refreshedGame)
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

    let onLoadConfig = (configContent: BingoConfiguration) => {
        const activeGameId:string = configContent.activeGameId ?? configContent.activeGame?.gameId ?? ""
        if ($activeGame?.gameId !== activeGameId)
        {
            BingoEBS.getGame(activeGameId)
                .then(game => {
                    activeGame.set(game)
                    onStart(game)
                    if (onReceiveGame)
                    {
                        onReceiveGame(game)
                    }
                })
                .catch(error => {
                    console.log(`Error fetching game ${activeGameId}: ${error}`)
                })
        }
    }

    const getCell = (row: number, col: number):[BingoGridCell,BingoEntry | null] => {
        var cellResult = $activeGrid.cells.filter(c => c.row === row && c.col === col);
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
                        // isColCompleted: false,
                        // isRowCompleted: false,
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
                key: -(col + (row * $activeGrid.cols)) - 1,
                text: "",
                state: BingoEntryState.Idle,
                timer: null,
                // isColCompleted: false,
                // isRowCompleted: false,
            },
            null
        ]
    }

</script>

<slot></slot>