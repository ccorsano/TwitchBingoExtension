import React from 'react';
import ViewerBingoComponentBase from '../../common/ViewerBingoComponentBase';
import { ViewerBingoComponentBaseState, ViewerBingoComponentBaseProps } from '../../common/ViewerBingoComponentBase';
import { BingoGame } from '../../EBS/BingoService/EBSBingoTypes';


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
            <svg viewBox={`0 0 ${this.state.columns} ${this.state.rows}`}>
                {
                    [...Array(this.state.rows).keys()].map(row => {
                        // let isRowComplete = this.isRowComplete(row);
                        return [...Array(this.state.columns).keys()].map(col => {
                            // let isColComplete = this.isColComplete(col);
                            let [_cell, entry] = this.getCell(row, col);
                            if (! entry)
                            {
                                var key = 1000 + col + (row * this.state.columns);
                                return <rect key={key} x={col+0.05} y={row+0.025} width="0.9" height="0.45" />
                            }
                            else
                            {
                                entry.text = ""
                                return <rect key={key} x={col+0.05} y={(row/2.0)+0.025} width="0.9" height="0.45" />
                            }
                        })
                    })
                }
            </svg>
        ]
   }
}