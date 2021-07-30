import { BingoEntry, BingoGame } from "../EBS/BingoService/EBSBingoTypes";

export type BingoGameContext = {
    isStarted: boolean,
    game?: BingoGame;
    onTentative: (entry: BingoEntry) => void;
    canModerate: boolean;
    canVote: boolean;
}
