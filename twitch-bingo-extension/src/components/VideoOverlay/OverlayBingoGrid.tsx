import React from "react";
import { ActiveGameContext, ActiveGridContext } from "../../common/BingoGameComponent";
import BingoViewerEntry from "../../common/BingoViewerEntry";
import LinearIndeterminateLoader from "../../common/LinearIndeterminateLoader";
import { BingoGrid } from "../../EBS/BingoService/EBSBingoTypes";
import { I18nContext } from "../../i18n/i18n-react";
import { BingoEntryState, BingoGridCell } from "../../model/BingoEntry";
import { jasminePalette, getRGB } from "../../common/BingoThemes";
const BingoHeaderTitle = require('../../../assets/BingoHeaderTitle.svg');

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
    <div style={{
        transition: 'opacity 0.5s',
        opacity: props.isCollapsed ? 0.0 : 1.0,
        width: '100%',
        borderWidth: '0.3rem',
        borderRadius: '2rem',
        borderColor: '#FFF',
        borderStyle: 'solid',
        boxShadow: '0px 0px 0.2rem 0px rgba(0,0,0,0.5)',
        paddingBottom: '1.2rem',
    }}>
        <div style={{
            margin: '0.5rem',
            borderWidth: '0.0645rem',
            borderTopLeftRadius: '1.4rem',
            borderTopRightRadius: '1.4rem',
            borderColor: '#FFF',
            borderStyle: 'solid',
            padding: '1.2rem',
            boxShadow: '0px 0px 0.2rem 0px rgba(0,0,0,0.5)',
        }}>
            <img src={BingoHeaderTitle} alt="Bingo Logo" style={{maxHeight: '4rem'}} />
        </div>
        <div style={{
            borderTopWidth: '0.3rem',
            borderColor: '#FFF',
            borderTopStyle: 'solid',
            boxShadow: '0px 0px 0.2rem 0px rgba(0,0,0,0.5)',
            padding: '0px',
            top: '0',
            position: 'relative',
            zIndex: -1, // Set it to be positioned behind the outer borders
            width: '100.1%', // Extend out on the right to not see a black border
        }}></div>
        <div style={{
            padding: '1.2rem',
            paddingBottom: '0rem',
        }}>
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