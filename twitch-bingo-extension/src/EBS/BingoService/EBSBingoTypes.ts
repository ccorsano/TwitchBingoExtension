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