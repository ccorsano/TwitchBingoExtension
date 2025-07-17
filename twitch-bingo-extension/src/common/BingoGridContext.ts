import type { BingoEntry, BingoGrid } from "../EBS/BingoService/EBSBingoTypes"
import type { BingoGridCell } from "../model/BingoEntry"

export type BingoGridContext = {
    grid: BingoGrid,
    getCell: (row: number, col: number) => [BingoGridCell, BingoEntry];
    isColComplete: (col: number) => boolean;
    isRowComplete: (row: number) => boolean;
}