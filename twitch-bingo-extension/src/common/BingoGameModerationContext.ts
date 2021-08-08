import { BingoEntry, BingoTentativeNotification } from "../EBS/BingoService/EBSBingoTypes";
import { BingoGameContext } from "./BingoGameContext";

export type BingoGameModerationContext = {
    gameContext: BingoGameContext;
    tentatives: BingoTentativeNotification[];
    onConfirm: (entry: BingoEntry) => void;
    onTentativeExpire: (entry: BingoTentativeNotification) => void;
    onTestTentative: (entry: BingoEntry) => void;
}