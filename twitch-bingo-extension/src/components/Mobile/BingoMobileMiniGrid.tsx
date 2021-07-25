import React from 'react'
import { BingoEntryState, BingoGridCell } from '../../model/BingoEntry';

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
    
    return (
        <svg viewBox={`0 0 ${props.columns} ${props.rows / 2}`}>
            <defs>
                <linearGradient spreadMethod="pad" id="idle" x1="0%" y1="70%" x2="70%" y2="0%">
                    <stop offset="33%" stopColor="rgb(255, 255, 255)" stopOpacity="0.8" />
                    <stop offset="90%" stopColor="rgb(200, 200, 200)" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient spreadMethod="pad" id="pending" x1="0%" y1="70%" x2="70%" y2="0%">
                    <stop offset="33%" stopColor="rgb(122, 196, 255)" stopOpacity="1" />
                    <stop offset="90%" stopColor="rgb(38, 214, 255)" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient spreadMethod="pad" id="confirmed" x1="0%" y1="70%" x2="70%" y2="0%">
                    <stop offset="33%" stopColor="rgb(223, 255, 50)" stopOpacity="0.8" />
                    <stop offset="90%" stopColor="rgb(151, 255, 124)" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient spreadMethod="pad" id="missed" x1="0%" y1="70%" x2="70%" y2="0%">
                    <stop offset="33%" stopColor="rgb(180, 180, 180)" stopOpacity="0.8" />
                    <stop offset="90%" stopColor="rgb(128, 128, 128)" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient spreadMethod="pad" id="rejected" x1="0%" y1="70%" x2="70%" y2="0%">
                    <stop offset="33%" stopColor="rgb(224, 129, 129)" stopOpacity="0.8" />
                    <stop offset="90%" stopColor="rgb(227, 79, 79)" stopOpacity="0.8" />
                </linearGradient>
            </defs>
            {
                [...Array(props.rows).keys()].map(row => {
                    // let isRowComplete = this.isRowComplete(row);
                    return [...Array(props.columns).keys()].map(col => {
                        // let isColComplete = this.isColComplete(col);
                        let cell = getCell(row, col);
                        if (! cell)
                        {
                            var key = 1000 + col + (row * this.state.columns);
                            return <rect key={key} x={col+0.05} y={row+0.025} width="0.9" height="0.45" rx="0.1" ry="0.1" />
                        }
                        else
                        {
                            const isSelected = cell.key === props.selectedKey
                            var gradient = "url(#idle)"
                            switch (cell.state) {
                                case BingoEntryState.Pending:
                                    gradient = "url(#pending)"
                                    break;
                                case BingoEntryState.Confirmed:
                                    gradient = "url(#confirmed)"
                                    break;
                                case BingoEntryState.Missed:
                                    gradient = "url(#missed)"
                                    break;
                                case BingoEntryState.Rejected:
                                    gradient = "url(#rejected)"
                                    break;
                                default:
                                    break;
                            }
                            if (isSelected)
                            {
                                gradient = "url(#pending)"
                            }
                            return (
                                <rect
                                    key={cell.key}
                                    x={col+0.05}
                                    y={(row/2.0)+0.025}
                                    width="0.9"
                                    height="0.45"
                                    fill={gradient}
                                    strokeWidth="0.01"
                                    strokeOpacity={isSelected ? "1.0" : "0.5"}
                                    stroke="black"
                                    rx="0.1"
                                    ry="0.1"
                                    onClickCapture={(_) => props.onSelectCell(col, row)}
                                />)
                        }
                    })
                })
            }
        </svg>
    )
}