import React from 'react'
import { getRGB, jasminePalette } from '../../common/BingoThemes';
import { I18nContext } from '../../i18n/i18n-react';
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
    const { LL } = React.useContext(I18nContext)

    function getCell(row: number, col: number)
    {
        return props.cells.find(c => c.row == row && c.col == col)
    }
    
    return (
        <svg viewBox={`0 0 ${props.columns} ${props.rows / 2}`}>
            <defs>
                <filter id="dropShadow" x="0" y="0" width="110%" height="110%">
                    <feDropShadow dx="0" dy="0" stdDeviation="0.025" floodOpacity="0.3"/>
                </filter>
            </defs>
            {
                [...Array(props.rows).keys()].map(row => {
                    // let isRowComplete = gridContext.isRowComplete(row);
                    return [...Array(props.columns).keys()].map(col => {
                        // let isColComplete = gridContext.isColComplete(col);
                        let cell = getCell(row, col);
                        if (! cell)
                        {
                            var key = 1000 + col + (row * props.columns);
                            return <rect key={key} x={col+0.025} y={row+0.025} width="0.9" height="0.45" rx="0.01" ry="0.01" />
                        }
                        else
                        {
                            const isSelected = cell.key === props.selectedKey
                            var fill = isSelected ? getRGB(jasminePalette.prompt) : getRGB(jasminePalette.base)
                            switch (cell.state) {
                                case BingoEntryState.Pending:
                                    fill = getRGB(jasminePalette.pending)
                                    break;
                                case BingoEntryState.Confirmed:
                                    fill = getRGB(isSelected ? jasminePalette.baseHover : jasminePalette.confirmed)
                                    break;
                                case BingoEntryState.Missed:
                                    fill = getRGB(isSelected ? jasminePalette.baseHover : jasminePalette.missed)
                                    break;
                                case BingoEntryState.Rejected:
                                    fill = getRGB(isSelected ? jasminePalette.baseHover : jasminePalette.missed)
                                    break;
                                default:
                                    break;
                            }

                            var text = ""
                            switch (cell.state) {
                                case BingoEntryState.Pending:
                                    text = LL.Mobile.PendingLabel()
                                    break;
                                case BingoEntryState.Confirmed:
                                    text = "✔"
                                    break;
                                case BingoEntryState.Missed:
                                    case BingoEntryState.Rejected:
                                    text = "✖"
                                    break;
                                default:
                                    break;
                            }

                            return (
                                <g key={cell.key} style={{userSelect: 'none'}}>
                                    <rect
                                        x={col+0.025}
                                        y={(row/2.0)+0.025}
                                        width="0.95"
                                        height="0.45"
                                        fill={fill}
                                        filter="url(#dropShadow)"
                                        strokeWidth="0.01"
                                        strokeOpacity={isSelected ? "0.8" : "0.5"}
                                        stroke="black"
                                        rx="0.01"
                                        ry="0.01"
                                        onClickCapture={(_) => props.onSelectCell(col, row)}
                                    />
                                    <text x={col + 0.5} y={(row/2.0) + 0.3} fontSize="0.125" textAnchor="middle" fill="#333">{text}</text>
                                </g>)
                        }
                    })
                })
            }
        </svg>
    )
}