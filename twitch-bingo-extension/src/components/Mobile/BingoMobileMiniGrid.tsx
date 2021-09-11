import React from 'react'
import { seededRand } from '../../common/ExtensionUtils';
import { BingoEntryState, BingoGridCell } from '../../model/BingoEntry';
const headerTitle = require("../../../assets/BingoHeaderMobile.svg")
require('./BingoMobileMiniGrid.scss');

type BingoMobileMiniGridProps = {
    cells: Array<BingoGridCell>,
    rows: number,
    columns: number,
    canVote: boolean,
    onSelectCell: (x: number, y: number) => void,
    selectedKey?: number,
}

export default function BingoMobileMiniGrid(props: BingoMobileMiniGridProps)
{
    function getCell(row: number, col: number)
    {
        return props.cells.find(c => c.row == row && c.col == col)
    }

    const cellSizeWithMargin = 900 / Math.max(props.columns, props.rows)
    const cellWidthWithMargin = 900 / props.columns
    const cellSize = cellSizeWithMargin-10
    const height = cellSizeWithMargin * props.rows + 180
    const seedStr = React.useMemo(() => `${props.columns}${props.rows}${props.cells.map(c => c.key).join('_')}`, [props.rows, props.columns])
    const rand = seededRand(seedStr)
    
    return (
        <svg className="mobileGrid" viewBox={`0 0 1000 ${height}`}>
            <defs>
            </defs>
            <rect className="gridBorder" x="10" y="10" width="980" height={height-20} rx="25" ry="25" />
            <image preserveAspectRatio="xMidYMid meet" x="50" y="0" width={900} height={125} href={headerTitle}/>
            <line className="gridBorder" x1="10" x2={990} y1="127.5" y2="127.5" />
            <g transform={"translate(50,155)"}>
                {
                    [...Array(props.rows).keys()].map(row => {
                        // let isRowComplete = gridContext.isRowComplete(row);
                        return [...Array(props.columns).keys()].map(col => {
                            // let isColComplete = gridContext.isColComplete(col);
                            let cell = getCell(row, col);
                            if (cell)
                            {
                                const isSelected = cell.key === props.selectedKey

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

                                var text = cell.key

                                const baseX = col*cellWidthWithMargin + (cellWidthWithMargin - cellSizeWithMargin)/2
                                const baseY = row*cellSizeWithMargin
                                const randX = rand()*(cellSize*0.250)-(cellSize*0.125)
                                const randY = rand()*(cellSize*0.250)-(cellSize*0.125)

                                const confirmationMark = cell.state == BingoEntryState.Confirmed ? (
                                    <circle cx={randX+baseX+cellSizeWithMargin/2} cy={randY+baseY+cellSizeWithMargin/2} r={cellSize/2.25} />
                                ) : null

                                return (
                                    <g className={classes.join(' ')} key={cell.key} style={{userSelect: 'none'}}>
                                        <rect
                                            className="background"
                                            x={baseX}
                                            y={baseY}
                                            width={cellSize}
                                            height={cellSize}
                                            rx={cellSize/5}
                                            ry={cellSize/5}
                                            onClickCapture={(_) => props.onSelectCell(col, row)}
                                        />
                                        <text x={baseX+cellSizeWithMargin/2} y={baseY+cellSizeWithMargin/2+cellSize/8} fontSize={cellSize/2}>{text}</text>
                                        { confirmationMark }
                                        <rect
                                            x={baseX}
                                            y={baseY}
                                            z="10"
                                            width={cellSize}
                                            height={cellSize}
                                            fill="rgba(255,255,255,0.0)"
                                            onClickCapture={(_) => props.onSelectCell(col, row)}
                                        />
                                    </g>)
                            }
                        })
                    })
                }
            </g>
        </svg>
    )
}