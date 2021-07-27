import React from 'react';
import ViewerBingoComponentBase from '../../common/ViewerBingoComponentBase';
import { ViewerBingoComponentBaseState, ViewerBingoComponentBaseProps } from '../../common/ViewerBingoComponentBase';
import { BingoGame, BingoGrid } from '../../EBS/BingoService/EBSBingoTypes';
import { BingoGridCell } from '../../model/BingoEntry';
import BingoMobileEntryList from './BingoMobileEntryList';
import BingoMobileMiniGrid from './BingoMobileMiniGrid';
require('./Mobile.scss');


interface MobileProps extends ViewerBingoComponentBaseProps {
}

interface MobileState extends ViewerBingoComponentBaseState {
    sortedEntries: BingoGridCell[]
    selectedCell?: number
}

export default class Mobile extends ViewerBingoComponentBase<MobileProps, MobileState> {
    state: MobileState = {
        isCollapsed: false,
        sortedEntries: new Array(0),
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
        this.setState({entries: payload.entries, onRefreshGrid: this.onRefreshGrid});
    };

    onSelectFromGrid = (x: number, y: number) => {
        const [cell,entry] = this.getCell(y, x)
        if (cell)
        {
            this.setState({
                selectedCell: entry.key
            })
        }
    }

    onSelectFromList = (key: number) => {
        const cell = this.state.grid.cells.find(c => c.key == key)
        if (cell)
        {
            this.setState({
                selectedCell: key
            })
        }
    }

    onRefreshGrid = (grid: BingoGrid) => {
        const cells = grid.cells.map(c => this.getCell(c.row, c.col)[0])
        const sortedEntries = cells.sort((cellA, cellB) => {
            return (cellA.row*grid.cols  + cellA.col) - (cellB.row*grid.cols  + cellB.col)
        })
        this.setState({
            sortedEntries: sortedEntries
        })
    }

    render()
    {
        if (!this.state.isStarted || !this.state.grid)
        {
            return null
        }
        return [
            <div style={{backgroundColor: '#FFF', width: '100vw', height: '100vh', display: 'grid', gridTemplateRows: 'auto 1fr'}}>
                <div style={{gridRow: 1, height: 'fit-content'}}>
                    <BingoMobileMiniGrid
                        cells={this.state.grid.cells.map(c => this.getCell(c.row, c.col)[0])}
                        rows={this.state.rows}
                        columns={this.state.columns}
                        canVote={this.state.canVote}
                        onSelectCell={this.onSelectFromGrid}
                        selectedKey={this.state.selectedCell}
                        />
                </div>
                <div style={{overflowY: "scroll", gridRow: 2}}>
                    <BingoMobileEntryList
                        entries={this.state.sortedEntries}
                        selectedKey={this.state.selectedCell}
                        onSelectKey={this.onSelectFromList}
                        onTentative={(key) => this.onTentative(this.state.entries.find(e => e.key === key))}
                        />
                </div>
            </div>
        ]
   }
}