import type { BingoEntry, BingoTentativeNotification } from "../EBS/BingoService/EBSBingoTypes"
import type { BingoGameContext } from "./BingoGameContext"

export type BingoGameModerationContext = {
    gameContext: BingoGameContext;
    tentatives: BingoTentativeNotification[];
    onConfirm: (entry: BingoEntry) => void;
    onTentativeExpire: (entry: BingoTentativeNotification) => void;
    onTestTentative: (entry: BingoEntry) => void;
    onForceNotify: (entry: BingoEntry) => void;
}