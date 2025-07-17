<script lang="ts">
    import { createGameContext, GameContextKey } from "../../stores/game";
    import { createGridContext, GridContextKey } from "../../stores/grid";
    import type { BingoGameContext } from "../../common/BingoGameContext";
    import type { BingoGridContext } from "../../common/BingoGridContext";
    import BingoGameComponent from "../../common/BingoGameComponent.svelte";
    import type { Writable } from "svelte/store";
    import { setContext } from "svelte";
    import { BingoEntryState, type BingoGridCell } from "../../model/BingoEntry";
    import type { BingoGrid } from "../../EBS/BingoService/EBSBingoTypes";
    import LL from '../../i18n/i18n-svelte';
    import LinearIndeterminateLoader from "../../common/LinearIndeterminateLoader.svelte";
    import BingoMobileMiniGrid from "./BingoMobileMiniGrid.svelte";
    import BingoMobileEntryList from "./BingoMobileEntryList.svelte";


    const gameContext:Writable<BingoGameContext> = createGameContext()
    setContext(GameContextKey, gameContext)
    const gridContext:Writable<BingoGridContext> = createGridContext()
    setContext(GridContextKey, gridContext)
    
    let selectedCell: number | null = null
    let sortedEntries: BingoGridCell[] = new Array(0)
    let minigridCells: BingoGridCell[] = new Array(0)

    function onSelectFromGrid(context: BingoGridContext, x: number, y: number) {
        const [cell,entry] = $gridContext.getCell(y, x)
        if (!cell)
        {
            console.error(`Could not find cell from minigrid at row ${y}, column ${x}`)
            return
        }
        if (cell.key != selectedCell)
        {
            selectedCell = entry.key
        }
        else
        {
            selectedCell = null
        }
    }

    function onSelectFromList(grid: BingoGrid, key: number) {
        const cell = $gridContext.grid.cells.find(c => c.key == key)
        if (!cell)
        {
            console.error(`Could not find cell from list for key ${key}`)
            return
        }
        if (cell.key != selectedCell)
        {
            selectedCell = cell.key
        }
        else
        {
            selectedCell = null
        }
    }

    function onRefreshGrid(grid: BingoGrid, cells: BingoGridCell[]) {
        const stateMultiplierBase = grid.rows * grid.cols * 10
        const pendingMultiplier = stateMultiplierBase
        const confirmedMultiplier = stateMultiplierBase * 10
        const missedMultiplier = stateMultiplierBase * 100
        sortedEntries = cells.sort((cellA, cellB) => {
            const cellAMult = (cellA.state === BingoEntryState.Idle || cellA.state === BingoEntryState.Pending) ? pendingMultiplier : (cellA.state === BingoEntryState.Confirmed ? confirmedMultiplier : missedMultiplier)
            const cellBMult = (cellB.state === BingoEntryState.Idle || cellB.state === BingoEntryState.Pending) ? pendingMultiplier : (cellB.state === BingoEntryState.Confirmed ? confirmedMultiplier : missedMultiplier)
            return (((cellA.row+1)*grid.cols  + cellA.col + 1) * cellAMult) - (((cellB.row + 1)*grid.cols  + cellB.col + 1) * cellBMult)
        })
        minigridCells = cells.map(c => $gridContext.getCell(c.row, c.col)[0])
    }

    function onTentative(key: number) {
        if ($gameContext.game)
        {
            const entry = $gameContext.game.entries.find(e => e.key === key)
            if (entry)
            {
                $gameContext.onTentative(entry)
            }
        }
    }
</script>

<BingoGameComponent
    onRefreshGrid={onRefreshGrid}
    onSharedIdentity={() => {}}
    >
{#if $gameContext}
    {#if !$gameContext.isAuthorized}
        <div style:background-color="#000" style:width="100vw" style:height="100vh" style:overflow="hidden">
            <div>
                <LinearIndeterminateLoader style="margin-bottom: 1rem; margin-top: 1rem;" />
            </div>
        </div>
    {:else if !$gameContext.hasSharedIdentity}
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div  style:background-color="#FFF" style:color="#000" style:width="100vw" style:height="100vh" style:overflow="hidden">
            <div style:margin-bottom="2rem" style:margin-top="1rem" style:padding="1rem">
                    {$LL.OverlayBingoGrid.IdentityPromptMessage()}
                </div>
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <div
                    class="bingoCellPrompt bingoCellPromptVisible"
                    style:position="unset" style:max-width="unset" style:text-align="center" style:height="fit-content" style:border-radius="unset"
                    on:click|capture={(_) => $gameContext.promptIdentity()}>
                    {$LL.OverlayBingoGrid.ShareIdentityButtonLabel()}
                </div>
        </div>
    {:else if $gameContext.isStarted && $gameContext.game && $gridContext.grid && minigridCells}
        <div style:display="grid" style:grid-template-rows="auto 1fr">
            <div style:grid-row={1} style:height="fit-content">
                <BingoMobileMiniGrid
                    cells={minigridCells}
                    rows={$gameContext.game.rows}
                    columns={$gameContext.game.columns}
                    canVote={$gameContext.canVote}
                    onSelectCell={(x,y) => onSelectFromGrid($gridContext, x, y)}
                    selectedKey={selectedCell}
                    />
            </div>
            <div style:overflow-y="scroll" style:grid-row={2}>
                <BingoMobileEntryList
                    entries={sortedEntries}
                    selectedKey={selectedCell}
                    onSelectKey={ key => onSelectFromList($gridContext.grid, key)}
                    onTentative={onTentative}
                    />
            </div>
        </div>
    {:else}
        <div style:color="#FFF">
            <div>
                <LinearIndeterminateLoader style="margin-bottom: 1rem; margin-top: 1rem;" />
                <div style:margin-top="2rem" style:text-align="center">
                    {$LL.OverlayBingoGrid.WaitingMessage()}
                </div>
            </div>
        </div>
    {/if}
{/if}
</BingoGameComponent>