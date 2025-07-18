import type { Readable } from "svelte/store";
import type { BingoEntry, BingoTentativeNotification } from "../EBS/BingoService/EBSBingoTypes"
import type { BingoGameContext } from "./BingoGameContext"

export type BingoGameModerationContext = {
    tentatives: BingoTentativeNotification[];
    onConfirm: (entry: BingoEntry) => void;
    onTentativeExpire: (entry: BingoEntry) => void;
    onTestTentative: (entry: BingoEntry) => void;
    onForceNotify: (entry: BingoEntry) => void;
}