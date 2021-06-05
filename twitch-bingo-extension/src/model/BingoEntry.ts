export class BingoEntry {
    public key: number;
    public text: string;
    public isNew: boolean;
}

export enum BingoEntryState {
    Idle,
    Pending,
    Confirmed,
    Missed,
}