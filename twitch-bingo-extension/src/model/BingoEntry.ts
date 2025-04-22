export class BingoEditableEntry {
    constructor(k:number, text:string, isNew:boolean) {
        this.key = k
        this.text = text
        this.isNew = isNew
    }

    public key: number;
    public text: string;
    public isNew: boolean;
}

export class BingoGridCell {
    constructor(row: number, col: number, key: number, text: string, state: BingoEntryState) {
        this.row = row
        this.col = col
        this.key = key
        this.text = text
        this.state = state
    }

    public row: number;
    public col: number;
    public key: number;
    public text: string;
    public state: BingoEntryState;
    public timer: Date | null = null;
}

export enum BingoEntryState {
    Idle = 0,
    Pending = 1,
    Confirmed = 2,
    Missed = 3,
    Rejected = 4,
}

export class BingoPendingResult {
    constructor(key: number, expireAt: Date) {
        this.key = key
        this.expireAt = expireAt
    }

    public key: number;
    public expireAt: Date;
}