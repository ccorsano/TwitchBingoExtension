import LinearProgress from "@material-ui/core/LinearProgress";
import React from "react";
import { ActiveGameContext, ActiveGridContext } from "../../common/BingoGameComponent";
import BingoViewerEntry from "../../common/BingoViewerEntry";
import { BingoGrid } from "../../EBS/BingoService/EBSBingoTypes";
import { BingoEntryState, BingoGridCell } from "../../model/BingoEntry";

export type OverlayBingoGridProps = {
    isCollapsed: boolean
}

export default function OverlayBingoGrid(props: OverlayBingoGridProps)
{
    const getCellFontSize = (grid: BingoGrid, _cell: BingoGridCell): string =>
    {
        var numberOfCells = grid.cols * grid.rows;

        // Function to get a vw unit font-size based on number of cells
        //  used these points for plotting: (6, 2.5vw), (12, 1.6vw), (16, 1.35vw), (20, 1.2vw)
        //  used https://mycurvefit.com/
        var fontSize = 0.7081993 + (6.028139 - 0.7081993)/(1 + Math.pow(numberOfCells/3.611081, 1.33441))

        return fontSize.toFixed(2) + "vw";
    }

    return (
        <ActiveGameContext.Consumer>
            { gameContext => (
                <ActiveGridContext.Consumer>
                { context => gameContext.isStarted ? (
                    <div 
                        className="bingoGrid"
                        style={{
                            gridTemplateRows: [...Array(context.grid.rows).keys()].map(() => '1fr').join(' '),
                            gridTemplateColumns: [...Array(context.grid.cols).keys()].map(() => '1fr').join(' ')
                        }}>
                        {
                            [...Array(context.grid.rows).keys()].map(row => {
                                let isRowComplete = context.isRowComplete(row);
                                return [...Array(context.grid.cols).keys()].map(col => {
                                    let isColComplete = context.isColComplete(col);
                                    let [cell, entry] = context.getCell(row, col);
                                    if (! entry)
                                    {
                                        var key = 1000 + col + (row * context.grid.cols);
                                        return <div key={key} style={{gridColumn: col + 1, gridRow: row + 1}}>
                                            <BingoViewerEntry
                                                config={{key: key, text: ""}}
                                                state={BingoEntryState.Idle}
                                                canInteract={false}
                                                canConfirm={false}
                                                isColCompleted={isColComplete}
                                                isRowCompleted={isRowComplete}
                                                onTentative={this.onTentative}
                                                fontSize="16px"
                                                isShown={!props.isCollapsed}
                                            />
                                        </div>
                                    }
                                    else
                                    {
                                        return <div key={cell.key} style={{gridColumn: col + 1, gridRow: row + 1}}>
                                            <BingoViewerEntry
                                                config={entry}
                                                state={cell.state}
                                                canInteract={gameContext.canVote && cell.state == BingoEntryState.Idle}
                                                canConfirm={gameContext.canModerate}
                                                isColCompleted={isColComplete}
                                                isRowCompleted={isRowComplete}
                                                countdown={cell.timer}
                                                onTentative={gameContext.onTentative}
                                                fontSize={getCellFontSize(context.grid, cell)}
                                                isShown={!props.isCollapsed}
                                            />
                                        </div>
                                    }
                                })
                            })
                        }
                    </div>
                )
                : (<div style={
                        {
                            backgroundColor:'rgba(245,245,245, 0.8)',
                            width: '100%',
                            textAlign: 'center',
                            paddingTop: '1vw',
                            paddingBottom: '1vw',
                            borderRadius: '0.25vw',
                            opacity: props.isCollapsed ? '0%' : '100%',
                        }}>
                        <LinearProgress style={{marginBottom: '1vw', marginTop: '1vw'}} />
                        Waiting for the game to start !
                    </div>
                )}
            </ActiveGridContext.Consumer>
            )}
        </ActiveGameContext.Consumer>
    )
}