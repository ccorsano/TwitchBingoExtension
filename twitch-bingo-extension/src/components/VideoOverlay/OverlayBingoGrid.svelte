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

interface CellModel {
    cell: BingoGridCell
    config: BingoEntry
    isRowCompleted: boolean
    isColCompleted: boolean
    fontSize: string
}

export let isCollapsed: boolean

let gameContextStore:Readable<BingoGameContext> = getContext("game")
let gameContext = $gameContextStore

let gridContextStore:Readable<BingoGridContext> = getContext("grid")
let gridContext:BingoGridContext = $gridContextStore
let gridTemplateRows = ""
let gridTemplateColumns = ""

// let gridContext:BingoGridContext = {
//     grid: {
//         gameId: "blah",
//         playerId: "blah",
//         cols: 1,
//         rows: 1,
//         cells:
//         [
//             {
//                 row: 0,
//                 col: 0,
//                 key: 0,
//                 state: BingoEntryState.Idle,
//             }
//         ]
//     },
//     getCell: getCell,
//     isColComplete: (col) => false,
//     isRowComplete: (row) => false,
// }

    let cells:CellModel[] = Array(0)

    if (gridContext?.grid != null)
    {
        cells = [...Array(gridContext.grid.rows).keys()]
            .flatMap(rowIdx => {
                let isRowComplete = gridContext.isRowComplete(rowIdx)
                return [...Array(gridContext.grid.cols).keys()].map(colIdx => {
                    let isColComplete = gridContext.isColComplete(colIdx)
                    let [cell,entry] = gridContext.getCell(rowIdx, colIdx)
                    if (! entry)
                    {
                        let key = 1000 + colIdx + (rowIdx * gridContext.grid.cols)
                        return {
                            config: entry,
                            cell: cell,
                            isRowCompleted: isRowComplete,
                            isColCompleted: isColComplete,
                            fontSize: "16px"
                        }
                    }
                    return {
                        config: entry,
                        cell: cell,
                        isRowCompleted: isRowComplete,
                        isColCompleted: isColComplete,
                        fontSize: "16px"
                    }
                })
            })

        gridTemplateRows = [...Array(gridContext.grid.rows).keys()].map(() => '1fr').join(' ')
        gridTemplateColumns = [...Array(gridContext.grid.cols).keys()].map(() => '1fr').join(' ')
    }
</script>

<style lang="scss">
    @import "./OverlayBingoGrid.scss"
</style>

<div>
    {#if gameContext?.isStarted && gridContext?.grid}
    <div class="gridOuterBox" class:collapsed={isCollapsed}>
        <div class="gridHeaderBox">
            <img src={BingoHeaderTitle} alt="Bingo Logo" style="height: '100%'" />
        </div>
        <div class="gridHeaderSeparator"></div>
        <div class="gridBodyBox">
            <div
                class={`bingoGrid c${gridContext.grid.cols} r${gridContext.grid.rows}`}
                style={`grid-template-rows: ${gridTemplateRows}; grid-template-colums: ${gridTemplateColumns}`}>
                {#each cells as cell (cell.cell.key)}
                    {#if !cell.config}
                    <div class="bingoCellArea" style={`grid-column: ${cell.cell.col + 1}; grid-row: ${cell.cell.row + 1}`}>
                        <BingoViewerEntry
                            config={{key: cell.cell.key, text: ""}}
                            state={BingoEntryState.Idle}
                            isColCompleted={cell.isColCompleted}
                            isRowCompleted={cell.isRowCompleted}
                            onTentative={gameContext.onTentative}
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
                            onTentative={gameContext.onTentative}
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
            <LinearIndeterminateLoader style="margin-bottom: '1rem'; margin-top: '1rem'" />
            <div style="margin-top: '2rem'">
                {$LL.OverlayBingoGrid.WaitingMessage()}
            </div>
        </div>
    {/if}
</div>