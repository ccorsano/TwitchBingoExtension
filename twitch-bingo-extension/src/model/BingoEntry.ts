export class BingoEntry {
    public key: number;
    public text: string;
    public isNew: boolean;
}

export enum BingoEntryState {
    Idle = 0,
    Pending = 1,
    Confirmed = 2,
    Missed = 3,
    Rejected = 4,
}