<script lang="ts">
    import type { BingoGameContext } from "../../common/BingoGameContext";
    import type { BingoGridContext } from "../../common/BingoGridContext";
    import type { BingoEntry } from "../../EBS/BingoService/EBSBingoTypes";
    import { BingoEntryState, type BingoGridCell } from "../../model/BingoEntry";
    import { LL } from "../../i18n/i18n-svelte";
    import BingoHeaderTitle from '../../../assets/BingoHeaderTitle.svg';
    import LinearIndeterminateLoader from "../../common/LinearIndeterminateLoader.svelte";
    import BingoViewerEntry from "../../common/BingoViewerEntry.svelte";
    import { getContext } from "svelte";
    import type { Readable } from "svelte/store";
    import { GameContextKey } from "../../stores/game";
    import { GridContextKey } from "../../stores/grid";

    interface CellModel {
        cell: BingoGridCell
        config: BingoEntry
        isRowCompleted: boolean
        isColCompleted: boolean
        fontSize: string
    }

    export let isCollapsed: boolean
    export let layoutClass: string

    const gameContext:Readable<BingoGameContext> = getContext(GameContextKey)
    gameContext.subscribe(context => {
        console.log(JSON.stringify(context))
    })

    let gridContext:Readable<BingoGridContext> = getContext(GridContextKey)
    let gridTemplateRows = ""
    let gridTemplateColumns = ""

    let cells:CellModel[] = Array(0)

    gridContext.subscribe(context => {
        cells = [...Array(context.grid.rows).keys()]
            .flatMap(rowIdx => {
                let isRowComplete = context.isRowComplete(rowIdx)
                return [...Array(context.grid.cols).keys()].map(colIdx => {
                    let isColComplete = context.isColComplete(colIdx)
                    let [cell,entry] = context.getCell(rowIdx, colIdx)
                    if (! entry)
                    {
                        let key = 1000 + colIdx + (rowIdx * $gridContext.grid.cols)
                        return {
                            key: key,
                            config: entry,
                            cell: cell,
                            isRowCompleted: isRowComplete,
                            isColCompleted: isColComplete,
                            fontSize: "16px"
                        }
                    }
                    return {
                        key: entry.key,
                        config: entry,
                        cell: cell,
                        isRowCompleted: isRowComplete,
                        isColCompleted: isColComplete,
                        fontSize: "16px"
                    }
                })
            })
        gridTemplateRows = [...Array($gridContext.grid.rows).keys()].map(() => '1fr').join(' ')
        gridTemplateColumns = [...Array($gridContext.grid.cols).keys()].map(() => '1fr').join(' ')
        console.log(JSON.stringify(cells))
    })
    
</script>

<style lang="scss">
    @import "./OverlayBingoGrid.scss"
</style>

{#if $gameContext.isStarted && $gridContext.grid}
<div class="gridOuterBox {layoutClass}" class:collapsed={isCollapsed}>
    <div class="gridHeaderBox">
        <img src={BingoHeaderTitle} alt="Bingo Logo" style:height="100%" />
    </div>
    <div class="gridHeaderSeparator"></div>
    <div class="gridBodyBox">
        <div
            class={`bingoGrid c${$gridContext.grid.cols} r${$gridContext.grid.rows}`}
            style={`grid-template-rows: ${gridTemplateRows}; grid-template-columns: ${gridTemplateColumns}`}>
            {#each cells as cell (cell.cell.key)}
                {#if !cell.config}
                <div class="bingoCellArea" style={`grid-column: ${cell.cell.col + 1}; grid-row: ${cell.cell.row + 1}`}>
                    <BingoViewerEntry
                        config={{key: cell.cell.key, text: ""}}
                        state={BingoEntryState.Idle}
                        isColCompleted={cell.isColCompleted}
                        isRowCompleted={cell.isRowCompleted}
                        onTentative={$gameContext.onTentative}
                        fontSize="16px"
                        isShown={!isCollapsed}
                    />
                </div>
                {:else}
                <div class="bingoCellArea" style={`grid-column: ${cell.cell.col + 1}; grid-row: ${cell.cell.row + 1}`}>
                    <BingoViewerEntry
                        config={cell.config}
                        state={cell.cell.state}
                        isColCompleted={cell.isColCompleted}
                        isRowCompleted={cell.isRowCompleted}
                        countdown={cell.cell.timer}
                        onTentative={$gameContext.onTentative}
                        fontSize={cell.fontSize}
                        isShown={!isCollapsed}
                    />
                </div>
                {/if}
            {/each}
        </div>
    </div>
</div>
{:else}
<div class="loadingGridBox" class:collapsed={isCollapsed}>
        <LinearIndeterminateLoader style="margin-bottom: 1rem; margin-top: 1rem" />
        <div style="margin-top: 2rem">
            {$LL.OverlayBingoGrid.WaitingMessage()}
        </div>
    </div>
{/if}