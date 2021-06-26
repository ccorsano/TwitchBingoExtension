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
    confirmationThreshold: string;
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

const TimeSpanRegexp = (/^(-?)((\d+)\.)?(\d{2}):(\d{2}):(\d{2})(\.(\d{7}))?$/);
export function ParseTimespan(timeSpan: string): number
{
    var result = TimeSpanRegexp.exec(timeSpan);
    var isNegative = result[1] === "-";
    var days = result[2] === undefined ? 0 : Number.parseInt(result[2]);
    var hours = Number.parseInt(result[4]);
    var minutes = Number.parseInt(result[5]);
    var secondes = Number.parseInt(result[6]);
    var microseconds = result[8] === undefined ? 0 : Number.parseInt(result[8]);

    return (isNegative ? -1 : 1) * ((days * 3600 * 24) + (hours * 3600) + (minutes * 60) + secondes + (microseconds/10000000));
}