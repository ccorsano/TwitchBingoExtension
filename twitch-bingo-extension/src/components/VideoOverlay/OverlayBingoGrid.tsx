import React from "react";
import clsx from 'clsx';
import { ActiveGameContext, ActiveGridContext } from "../../common/BingoGameComponent";
import BingoViewerEntry from "../../common/BingoViewerEntry";
import LinearIndeterminateLoader from "../../common/LinearIndeterminateLoader";
import { BingoGrid } from "../../EBS/BingoService/EBSBingoTypes";
import { I18nContext } from "../../i18n/i18n-react";
import { BingoEntryState, BingoGridCell } from "../../model/BingoEntry";
import { jasminePalette, getRGB } from "../../common/BingoThemes";
const BingoHeaderTitle = require('../../../assets/BingoHeaderTitle.svg');
require("./OverlayBingoGrid.scss")

export type OverlayBingoGridProps = {
    isCollapsed: boolean
}

export default function OverlayBingoGrid(props: OverlayBingoGridProps)
{
    const { LL } = React.useContext(I18nContext)
    const gameContext = React.useContext(ActiveGameContext)
    const context = React.useContext(ActiveGridContext)
    
    const getCellFontSize = (grid: BingoGrid, _cell: BingoGridCell): string =>
    {
        var numberOfCells = grid.cols * grid.rows;

        // Function to get a vw unit font-size based on number of cells
        //  used these points for plotting: (6, 2.5vw), (12, 1.6vw), (16, 1.35vw), (20, 1.2vw)
        //  used https://mycurvefit.com/
        var fontSize = 0.7081993 + (6.028139 - 0.7081993)/(1 + Math.pow(numberOfCells/3.611081, 1.33441))

        return fontSize.toFixed(2) + "vw";
    }

    return gameContext.isStarted && context.grid ? (
    <div className={clsx("gridOuterBox")} style={{opacity: props.isCollapsed ? 0.0 : 1.0}}>
        <div className={clsx("gridHeaderBox")}>
            <img src={BingoHeaderTitle} alt="Bingo Logo" style={{height: '100%'}} />
        </div>
        <div className={clsx("gridHeaderSeparator")}></div>
        <div className={clsx("gridBodyBox")}>
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
                                        onTentative={gameContext.onTentative}
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
        </div>
    </div>
    )
    : (<div style={
            {
                backgroundColor: getRGB(jasminePalette.base),
                width: '100%',
                textAlign: 'center',
                paddingTop: '1vw',
                paddingBottom: '1vw',
                borderRadius: '0.25vw',
                opacity: props.isCollapsed ? '0%' : '100%',
                transition: 'opacity 0.5s'
            }}>
            <LinearIndeterminateLoader style={{marginBottom: '1rem', marginTop: '1rem'}} />
            <div style={{marginTop: '2rem'}}>
                {LL.OverlayBingoGrid.WaitingMessage()}
            </div>
        </div>
    )
}
