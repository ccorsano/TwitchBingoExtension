import type { BingoEntry, BingoGame } from "../EBS/BingoService/EBSBingoTypes";

export type BingoGameContext = {
    isStarted: boolean,
    isAuthorized: boolean,
    hasSharedIdentity: boolean,
    promptIdentity: () => void,
    game?: BingoGame;
    onTentative: (entry: BingoEntry) => void;
    requestRefresh: (gameId: string) => void;
    canModerate: boolean;
    canVote: boolean;
}
