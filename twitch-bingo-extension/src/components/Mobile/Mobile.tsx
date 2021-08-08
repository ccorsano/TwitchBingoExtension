import React from 'react';
import clsx from 'clsx';
import BingoGameComponent, { ActiveGameContext, ActiveGridContext } from '../../common/BingoGameComponent';
import { BingoGridContext } from '../../common/BingoGridContext';
import { getRGB, jasminePalette } from '../../common/BingoThemes';
import LinearIndeterminateLoader from '../../common/LinearIndeterminateLoader';
import { BingoGrid } from '../../EBS/BingoService/EBSBingoTypes';
import { I18nContext } from '../../i18n/i18n-react';
import { BingoEntryState, BingoGridCell } from '../../model/BingoEntry';
import BingoMobileEntryList from './BingoMobileEntryList';
import BingoMobileMiniGrid from './BingoMobileMiniGrid';
require('./Mobile.scss');
require('./BingoMobileEntryList.scss');


export default function Mobile()
{
    const { LL } = React.useContext(I18nContext)
    
    const [selectedCell, setSelectedCell] = React.useState(null)
    const [sortedEntries, setSortedEntries] = React.useState<BingoGridCell[]>()

    const onSelectFromGrid = React.useCallback((context: BingoGridContext, x: number, y: number) => {
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
    }, [selectedCell])

    const onSelectFromList = React.useCallback((grid: BingoGrid, key: number) => {
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
    }, [selectedCell])

    const onRefreshGrid = (grid: BingoGrid, cells: BingoGridCell[]) => {
        const stateMultiplierBase = grid.rows * grid.cols * 10
        const pendingMultiplier = stateMultiplierBase
        const confirmedMultiplier = stateMultiplierBase * 10
        const missedMultiplier = stateMultiplierBase * 100
        const sortedEntries = cells.sort((cellA, cellB) => {
            const cellAMult = (cellA.state === BingoEntryState.Idle || cellA.state === BingoEntryState.Pending) ? pendingMultiplier : (cellA.state === BingoEntryState.Confirmed ? confirmedMultiplier : missedMultiplier)
            const cellBMult = (cellB.state === BingoEntryState.Idle || cellB.state === BingoEntryState.Pending) ? pendingMultiplier : (cellB.state === BingoEntryState.Confirmed ? confirmedMultiplier : missedMultiplier)
            return (((cellA.row+1)*grid.cols  + cellA.col + 1) * cellAMult) - (((cellB.row + 1)*grid.cols  + cellB.col + 1) * cellBMult)
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
                                    if (! gameContext.isAuthorized)
                                    {
                                        return (
                                            <div  style={{backgroundColor: getRGB(jasminePalette.base), width: '100vw', height: '100vh', overflow: 'hidden'}}>
                                                <div>
                                                    <LinearIndeterminateLoader style={{marginBottom: '1rem', marginTop: '1rem'}} />
                                                </div>
                                            </div>
                                        )
                                    }

                                    if (! gameContext.hasSharedIdentity)
                                    {
                                        return (
                                        <div  style={{backgroundColor: getRGB(jasminePalette.base), width: '100vw', height: '100vh', overflow: 'hidden'}}>
                                            <div style={{marginBottom: '2rem', marginTop: '1rem', padding: '1rem'}}>
                                                    {LL.OverlayBingoGrid.IdentityPromptMessage()}
                                                </div>
                                                <div
                                                    className={clsx("bingoCellPrompt", "bingoCellPromptVisible")}
                                                    style={{position: 'unset', maxWidth: 'unset', textAlign: 'center', height: 'fit-content'}}
                                                    onClickCapture={(_) => gameContext.promptIdentity()}>
                                                    {LL.OverlayBingoGrid.ShareIdentityButtonLabel()}
                                                </div>
                                        </div>
                                        )
                                    }

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
                                    ): <div  style={{backgroundColor: getRGB(jasminePalette.base), width: '100vw', height: '100vh', overflow: 'hidden'}}>
                                        <div>
                                            <LinearIndeterminateLoader style={{marginBottom: '1rem', marginTop: '1rem'}} />
                                            <div style={{marginTop: '2rem', textAlign: 'center'}}>
                                                {LL.OverlayBingoGrid.WaitingMessage()}
                                            </div>
                                        </div>
                                    </div>
                                }
                                
                        }
                    </ActiveGridContext.Consumer>
            }
            </ActiveGameContext.Consumer>
        </BingoGameComponent>
    )
}
