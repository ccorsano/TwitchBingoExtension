import React from 'react'
import { seededRand } from '../../common/ExtensionUtils';
import { BingoEntryState, BingoGridCell } from '../../model/BingoEntry';
const headerTitle = require("../../../assets/BingoHeaderMobile.svg")

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
    const cellSize = cellSizeWithMargin-10
    const height = cellSizeWithMargin * props.rows + 180
    const seedStr = React.useMemo(() => `${props.columns}${props.rows}${props.cells.map(c => c.key).join('_')}`, [props.rows, props.columns])
    const rand = seededRand(seedStr)
    
    return (
        <svg viewBox={`0 0 1000 ${height}`} style={{backgroundColor: "black"}}>
            <defs>
            </defs>
            <rect x="10" y="10" width="980" height={height-20} rx="10" ry="10" style={{strokeWidth: 5, stroke: "white"}} />
            <image preserveAspectRatio="xMidYMid meet" x="50" y="0" width={900} height={125} href={headerTitle}/>
            <line x1="10" x2={990} y1="127.5" y2="127.5" style={{strokeWidth: 5, stroke: "white"}} />
            <g transform={"translate(0,14)"}>
                {
                    [...Array(props.rows).keys()].map(row => {
                        // let isRowComplete = gridContext.isRowComplete(row);
                        return [...Array(props.columns).keys()].map(col => {
                            // let isColComplete = gridContext.isColComplete(col);
                            let cell = getCell(row, col);
                            if (! cell)
                            {
                                var key = 1000 + col + (row * props.columns);
                                return <rect key={key} x={(col+0.025)*10} y={(row+0.025)*10} width="9" height="9" rx="0.1" ry="0.1" style={{backgroundColor: "white"}} />
                            }
                            else
                            {
                                const isSelected = cell.key === props.selectedKey

                                var fill = "white"
                                switch (cell.state) {
                                    case BingoEntryState.Missed:
                                        case BingoEntryState.Rejected:
                                        fill = "gray"
                                        break;
                                    default:
                                        fill = "white"
                                        break;
                                }

                                var text = cell.key

                                const randX = rand()*(cellSize*0.250)-(cellSize*0.125)
                                const randY = rand()*(cellSize*0.250)-(cellSize*0.125)

                                console.log(`${randX},${randY}`)

                                const confirmationMark = cell.state == BingoEntryState.Confirmed ? (
                                    <circle fill="rgba(229,39,93,0.79)" cx={randX+col*cellSizeWithMargin+50+cellSize/2} cy={randY+row*cellSizeWithMargin+135+cellSize/2} r={cellSize/2.25} z="9" />
                                ) : null

                                return (
                                    <g key={cell.key} style={{userSelect: 'none'}}>
                                        <rect
                                            x={col*cellSizeWithMargin+50}
                                            y={row*cellSizeWithMargin+135}
                                            width={cellSize}
                                            height={cellSize}
                                            fill={fill}
                                            rx={cellSize/5}
                                            ry={cellSize/5}
                                            strokeOpacity={isSelected ? 1.0 : 0.0}
                                            strokeWidth={10}
                                            stroke={"darkgray"}
                                            onClickCapture={(_) => props.onSelectCell(col, row)}
                                        />
                                        <text x={col*cellSizeWithMargin+50+cellSize/2} y={row*cellSizeWithMargin+160+cellSize/2} z="0" fontSize={cellSize/2} textAnchor="middle" fill="#000">{text}</text>
                                        { confirmationMark }
                                        <rect
                                            x={col*cellSizeWithMargin+50}
                                            y={row*cellSizeWithMargin+135}
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