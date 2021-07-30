import { BingoEntry, BingoGrid } from "../EBS/BingoService/EBSBingoTypes";
import { BingoGridCell } from "../model/BingoEntry";

export type BingoGridContext = {
    grid: BingoGrid,
    getCell: (row: number, col: number) => [BingoGridCell, BingoEntry];
    isColComplete: (col: number) => boolean;
    isRowComplete: (row: number) => boolean;
}