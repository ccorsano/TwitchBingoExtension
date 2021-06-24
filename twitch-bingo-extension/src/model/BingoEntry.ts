export class BingoEntry {
    public key: number;
    public text: string;
    public isNew: boolean;
}

export class BingoGridCell {
    public row: number;
    public col: number;
    public key: number;
    public text: string;
    public state: BingoEntryState;
}

export enum BingoEntryState {
    Idle = 0,
    Pending = 1,
    Confirmed = 2,
    Missed = 3,
    Rejected = 4,
}