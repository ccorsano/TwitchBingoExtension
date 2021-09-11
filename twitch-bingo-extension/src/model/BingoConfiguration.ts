import { BingoGame } from "../EBS/BingoService/EBSBingoTypes";
import { BingoEditableEntry } from "./BingoEntry";

export type BingoConfiguration = {
    nextKey: number
    entries: BingoEditableEntry[]
    selectedEntries: number[]
    rows: number
    columns: number
    confirmationThreshold: number
    activeGame?: BingoGame
    activeGameId?: string
}

export type BingoBroadcastEvent = {
    type: BingoBroadcastEventType,
    payload: any
}

export enum BingoBroadcastEventType {
    SetConfig = "set-config",
    Start = "start",
    Stop = "stop",
    Bingo = "bingo",
    Confirm = "confirm",
    Tentative = "tentative"
}