import type { BingoGridContext } from 'src/common/BingoGridContext';
import { DefaultEntry, type BingoEntry, type BingoGrid } from '../EBS/BingoService/EBSBingoTypes';
import { BingoEntryState, BingoGridCell } from '../model/BingoEntry';
import { writable, type Readable, type Writable } from 'svelte/store';

const _defaultGrid: BingoGrid = {
    gameId: "",
    playerId: "",
    cols: 0,
    rows: 0,
    cells: Array<BingoGridCell>(0)
}

const _defaultGridContext: BingoGridContext = {
    grid: _defaultGrid,
    getCell: (row: number, col: number) => [
        new BingoGridCell(row, col, 0, "", BingoEntryState.Idle),
        DefaultEntry],
    isColComplete: (col: number) => false,
    isRowComplete: (row: number) => false,
}

export function createGrid() {
    return writable<BingoGrid>(_defaultGrid)
}

export function createGridContext() {
    return writable<BingoGridContext>(_defaultGridContext)
}

export function setGrid(context: Writable<BingoGridContext>, grid: BingoGrid) {
    context.update(context => {
        context.grid = grid
        return context
    })
}

export const GridContextKey = Symbol()