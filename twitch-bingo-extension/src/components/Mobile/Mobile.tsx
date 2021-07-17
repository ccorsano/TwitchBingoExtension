import React from 'react';
import BingoViewerEntry from '../../common/BingoViewerEntry';
import ViewerBingoComponentBase from '../../common/ViewerBingoComponentBase';
import { ViewerBingoComponentBaseState, ViewerBingoComponentBaseProps } from '../../common/ViewerBingoComponentBase';
import { BingoGame } from '../../EBS/BingoService/EBSBingoTypes';
import { BingoEntryState } from '../../model/BingoEntry';


interface MobileProps extends ViewerBingoComponentBaseProps {
}

interface MobileState extends ViewerBingoComponentBaseState {
}

export default class Mobile extends ViewerBingoComponentBase<MobileProps, MobileState> {
    state: MobileState = {
        entries: new Array(0),
        rows: 3,
        columns: 3,
        canModerate: false,
        canVote: false,
        isStarted: false,
        pendingResults: new Array(0),
        moderationDrawerOpen: false,
    }

    constructor(props: MobileProps){
        super(props)
    };

    componentDidMount() {
        super.componentDidMount();
    };

    onStart(payload: BingoGame) {
        super.onStart(payload);
        this.setState({entries : payload.entries});
    };

    render()
    {
        if (!this.state.isStarted)
        {
            return null
        }
        return [
            <div className="bingoGrid">
                {
                    [...Array(this.state.rows).keys()].map(row => {
                        let isRowComplete = this.isRowComplete(row);
                        return [...Array(this.state.columns).keys()].map(col => {
                            let isColComplete = this.isColComplete(col);
                            let [cell, entry] = this.getCell(row, col);
                            if (! entry)
                            {
                                var key = 1000 + col + (row * this.state.columns);
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
                                    />
                                </div>
                            }
                            else
                            {
                                entry.text = ""
                                return <div key={cell.key} style={{gridColumn: col + 1, gridRow: row + 1}}>
                                    <BingoViewerEntry
                                        config={entry}
                                        state={cell.state}
                                        canInteract={this.state.canVote && cell.state == BingoEntryState.Idle}
                                        canConfirm={this.state.canModerate}
                                        isColCompleted={isColComplete}
                                        isRowCompleted={isRowComplete}
                                        countdown={cell.timer}
                                        onTentative={this.onTentative}
                                        fontSize={this.getCellFontSize(cell)}
                                    />
                                </div>
                            }
                        })
                    })
                }
            </div>
        ]
   }
}