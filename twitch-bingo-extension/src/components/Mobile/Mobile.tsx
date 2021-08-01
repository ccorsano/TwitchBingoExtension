import React from 'react';
import BingoGameComponent, { ActiveGameContext, ActiveGridContext } from '../../common/BingoGameComponent';
import { BingoGridContext } from '../../common/BingoGridContext';
import { BingoGrid } from '../../EBS/BingoService/EBSBingoTypes';
import { BingoEntryState, BingoGridCell } from '../../model/BingoEntry';
import BingoMobileEntryList from './BingoMobileEntryList';
import BingoMobileMiniGrid from './BingoMobileMiniGrid';
require('./Mobile.scss');


export default function Mobile()
{
    const [selectedCell, setSelectedCell] = React.useState(null)
    const [sortedEntries, setSortedEntries] = React.useState<BingoGridCell[]>()

    const onSelectFromGrid = (context: BingoGridContext, x: number, y: number) => {
        const [cell,entry] = context.getCell(y, x)
        if (!cell)
        {
            console.error(`Could not find cell from minigrid at row ${y}, column ${x}`)
            return
        }
        if (cell.key != selectedCell)
        {
            setSelectedCell(entry.key)
        }
        else
        {
            setSelectedCell(null)
        }
    }

    const onSelectFromList = (grid: BingoGrid, key: number) => {
        const cell = grid.cells.find(c => c.key == key)
        if (!cell)
        {
            console.error(`Could not find cell from list for key ${key}`)
            return
        }
        if (cell.key != selectedCell)
        {
            setSelectedCell(cell.key)
        }
        else
        {
            setSelectedCell(null)
        }
    }

    const onRefreshGrid = (grid: BingoGrid, cells: BingoGridCell[]) => {
        const stateMultiplierBase = grid.rows * grid.cols * 10
        const pendingMultiplier = 1
        const confirmedMultiplier = stateMultiplierBase * 10
        const missedMultiplier = stateMultiplierBase * 100
        const sortedEntries = cells.sort((cellA, cellB) => {
            const cellAMult = cellA.state === BingoEntryState.Idle ? pendingMultiplier : (cellA.state === BingoEntryState.Confirmed ? confirmedMultiplier : missedMultiplier)
            const cellBMult = cellB.state === BingoEntryState.Idle ? pendingMultiplier : (cellB.state === BingoEntryState.Confirmed ? confirmedMultiplier : missedMultiplier)
            return ((cellA.row*grid.cols  + cellA.col) * cellAMult) - ((cellB.row*grid.cols  + cellB.col) * cellBMult)
        })
        setSortedEntries(sortedEntries)
    }

    return (
        <BingoGameComponent onRefreshGrid={onRefreshGrid}>
            <ActiveGameContext.Consumer>
                { gameContext => 
                    <ActiveGridContext.Consumer>
                        {
                            gridContext => 
                                {
                                    const shouldRender = gameContext.isStarted && gridContext.grid && sortedEntries
                                    return shouldRender ? (
                                        <div style={{backgroundColor: '#FFF', width: '100vw', height: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr'}}>
                                            <div style={{gridRow: 1, height: 'fit-content'}}>
                                                <BingoMobileMiniGrid
                                                    cells={gridContext.grid.cells.map(c => gridContext.getCell(c.row, c.col)[0])}
                                                    rows={gameContext.game.rows}
                                                    columns={gameContext.game.columns}
                                                    canVote={gameContext.canVote}
                                                    onSelectCell={(x,y) => onSelectFromGrid(gridContext, x, y)}
                                                    selectedKey={selectedCell}
                                                    />
                                            </div>
                                            <div style={{overflowY: "scroll", gridRow: 2}}>
                                                <BingoMobileEntryList
                                                    entries={sortedEntries}
                                                    selectedKey={selectedCell}
                                                    onSelectKey={ key => onSelectFromList(gridContext.grid, key)}
                                                    onTentative={(key) => gameContext.onTentative(gameContext.game.entries.find(e => e.key === key))}
                                                    />
                                            </div>
                                        </div>
                                    ): null
                                }
                                
                        }
                    </ActiveGridContext.Consumer>
            }
            </ActiveGameContext.Consumer>
        </BingoGameComponent>
    )
}
