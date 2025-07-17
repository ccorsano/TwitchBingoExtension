<script lang="ts">
    import { seededRand } from "../../common/ExtensionUtils";
    import { BingoEntryState, BingoGridCell } from "../../model/BingoEntry";
    import headerTitle from "../../../assets/BingoHeaderMobile.svg"

    export let cells: Array<BingoGridCell> = new Array(0)
    export let rows: number
    export let columns: number
    export let canVote: boolean
    export let onSelectCell: (x: number, y: number) => void
    export let selectedKey: number | null = null

    const cellSizeWithMargin = 900 / Math.max(columns, rows)
    const cellWidthWithMargin = 900 / columns
    const cellSize = cellSizeWithMargin-10
    const height = cellSizeWithMargin * rows + 180
    let seedStr: string = ""
    $: seedStr = `${columns}${rows}${cells.map(c => c.key).join('_')}`, [rows, columns]
    const rand = seededRand(seedStr)

    function getEntryInfos(cells: BingoGridCell[], row: number, col: number, selectedKey: number | null) {
        let cell = cells.find(c => c.row == row && c.col == col)
        if (!cell) {
            return null
        }

        const isSelected = cell.key === selectedKey

        var classes: string[] = Array();

        switch (cell.state) {
            case BingoEntryState.Confirmed:
                classes.push("confirmed")
                break;
            case BingoEntryState.Idle:
                classes.push("idle")
                break;
            case BingoEntryState.Missed:
            case BingoEntryState.Rejected:
                classes.push("missed")
                break;
            case BingoEntryState.Pending:
                classes.push("pending")
                break;
            default:
                break;
        }
        if (isSelected)
        {
            classes.push("highlighted")
        }

        return {
            row: row,
            col: col,
            text: cell.key,
            cell: cell,
            classes: classes,
            baseX: col*cellWidthWithMargin + (cellWidthWithMargin - cellSizeWithMargin)/2,
            baseY: row*cellSizeWithMargin,
            randX: rand()*(cellSize*0.250)-(cellSize*0.125),
            randY: rand()*(cellSize*0.250)-(cellSize*0.125),
        }
    }

    let entriesInfos: any
    $: entriesInfos = [...Array(rows).keys()].map(row => [...Array(columns).keys()].map(col => getEntryInfos(cells, row, col, selectedKey))).flat(1)
</script>

<style lang="scss">
    @use "./BingoMobileMiniGrid.scss"
</style>

<svg class="mobileGrid" viewBox={`0 0 1000 ${height}`}>
    <defs>
    </defs>
    <rect class="gridBorder" x="10" y="10" width="980" height={height-20} rx="25" ry="25" />
    <image preserveAspectRatio="xMidYMid meet" x="50" y="0" width={900} height={125} href={headerTitle}/>
    <line class="gridBorder" x1="10" x2={990} y1="127.5" y2="127.5" />
    <g transform="translate(50,155)">
        {#each entriesInfos as entryInfo}
            {#if entryInfo}
                <!-- svelte-ignore a11y-click-events-have-key-events -->
                <g class={entryInfo.classes.join(' ')} style="user-select: 'none';">
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <rect
                        class="background"
                        x={entryInfo.baseX}
                        y={entryInfo.baseY}
                        width={cellSize}
                        height={cellSize}
                        rx={cellSize/5}
                        ry={cellSize/5}
                        on:click|capture={(_) => onSelectCell(entryInfo.col, entryInfo.row)}
                    />
                    <text x={entryInfo.baseX+cellSizeWithMargin/2} y={entryInfo.baseY+cellSizeWithMargin/2+cellSize/8} font-size={cellSize/2}>{entryInfo.text}</text>
                    {#if entryInfo.cell.state == BingoEntryState.Confirmed}
                        <circle cx={entryInfo.randX+entryInfo.baseX+cellSizeWithMargin/2}
                                cy={entryInfo.randY+entryInfo.baseY+cellSizeWithMargin/2}
                                r={cellSize/2.25} />
                    {/if}
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <!-- svelte-ignore a11y-no-static-element-interactions -->
                    <rect
                        x={entryInfo.baseX}
                        y={entryInfo.baseY}
                        z="10"
                        width={cellSize}
                        height={cellSize}
                        fill="rgba(255,255,255,0.0)"
                        on:click|capture={(_) => onSelectCell(entryInfo.col, entryInfo.row)}
                    />
                </g>
            {/if}
        {/each}
    </g>
</svg>