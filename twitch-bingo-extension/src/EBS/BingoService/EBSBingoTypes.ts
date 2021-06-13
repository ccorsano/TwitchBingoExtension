import { BingoEntryState } from "../../model/BingoEntry";

export interface BingoEntry {
    key: number;
    text: string;
    confirmedAt?: Date;
    confirmedBy?: string;
}

export interface BingoGame {
    gameId: string;
    channelId: string;
    entries: BingoEntry[];
    rows: number;
    columns: number;
}

export interface BingoGameCreationParams {
    rows: number;
    columns: number;
    entries: BingoEntry[];
}

export interface BingoTentative {
    entryKey: string;
    confirmed: boolean;
    tentativeTime: Date;
}

export interface BingoGridCell {
    row: number;
    col: number;
    key: number;
    state: BingoEntryState;
}

export interface BingoGrid {
    gameId: string;
    playerId: string;
    cols: number;
    rows: number;
    cells: BingoGridCell[];
}