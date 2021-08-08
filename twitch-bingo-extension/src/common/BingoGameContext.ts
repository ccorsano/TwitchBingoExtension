import { BingoEntry, BingoGame } from "../EBS/BingoService/EBSBingoTypes";

export type BingoGameContext = {
    isStarted: boolean,
    isAuthorized: boolean,
    hasSharedIdentity: boolean,
    promptIdentity: () => void,
    game?: BingoGame;
    onTentative: (entry: BingoEntry) => void;
    canModerate: boolean;
    canVote: boolean;
}
