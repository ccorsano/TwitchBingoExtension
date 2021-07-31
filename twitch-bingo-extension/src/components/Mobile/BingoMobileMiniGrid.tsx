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
                    <stop offset="33%" stopColor="rgb(245, 245, 245)" stopOpacity="1" />
                    <stop offset="90%" stopColor="rgb(255, 255, 255)" stopOpacity="1" />
                </linearGradient>
                <linearGradient spreadMethod="pad" id="pending" x1="0%" y1="70%" x2="70%" y2="0%">
                    <stop offset="33%" stopColor="rgb(240,250,255)" stopOpacity="1" />
                    <stop offset="90%" stopColor="rgb(240,255,255 )" stopOpacity="1" />
                </linearGradient>
                <linearGradient spreadMethod="pad" id="confirmed" x1="0%" y1="70%" x2="70%" y2="0%">
                    <stop offset="33%" stopColor="rgb(238, 232, 170)" stopOpacity="0.8" />
                    <stop offset="90%" stopColor="rgb(234, 227, 149)" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient spreadMethod="pad" id="missed" x1="0%" y1="70%" x2="70%" y2="0%">
                    <stop offset="33%" stopColor="rgb(204, 204, 204)" stopOpacity="0.8" />
                    <stop offset="90%" stopColor="rgb(230, 230, 230)" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient spreadMethod="pad" id="rejected" x1="0%" y1="70%" x2="70%" y2="0%">
                    <stop offset="33%" stopColor="rgb(204, 204, 204)" stopOpacity="0.8" />
                    <stop offset="90%" stopColor="rgb(230, 230, 230)" stopOpacity="0.8" />
                </linearGradient>
                <filter id="dropShadow" x="0" y="0" width="110%" height="110%">
                    <feDropShadow dx="0" dy="0" stdDeviation="0.025" floodOpacity="0.3"/>
                </filter>
            </defs>
            {
                [...Array(props.rows).keys()].map(row => {
                    // let isRowComplete = this.isRowComplete(row);
                    return [...Array(props.columns).keys()].map(col => {
                        // let isColComplete = this.isColComplete(col);
                        let cell = getCell(row, col);
                        if (! cell)
                        {
                            var key = 1000 + col + (row * props.columns);
                            return <rect key={key} x={col+0.025} y={row+0.025} width="0.9" height="0.45" rx="0.01" ry="0.01" />
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
                            if (isSelected && cell.state === BingoEntryState.Idle)
                            {
                                gradient = "url(#pending)"
                            }
                            return (
                                <rect
                                    key={cell.key}
                                    x={col+0.025}
                                    y={(row/2.0)+0.025}
                                    width="0.95"
                                    height="0.45"
                                    fill={gradient}
                                    filter="url(#dropShadow)"
                                    strokeWidth="0.01"
                                    strokeOpacity={isSelected ? "1.0" : "0.5"}
                                    stroke="black"
                                    rx="0.01"
                                    ry="0.01"
                                    onClickCapture={(_) => props.onSelectCell(col, row)}
                                />)
                        }
                    })
                })
            }
        </svg>
    )
}