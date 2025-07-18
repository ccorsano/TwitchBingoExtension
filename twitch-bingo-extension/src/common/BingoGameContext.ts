import type { BingoEntry, BingoGame, BingoTentative } from "../EBS/BingoService/EBSBingoTypes";

export type BingoGameContext = {
    isStarted: boolean,
    isAuthorized: boolean,
    hasSharedIdentity: boolean,
    promptIdentity: () => void,
    game?: BingoGame;
    onTentative: (entry: BingoEntry) => Promise<BingoTentative>;
    requestRefresh: (gameId: string) => void;
    canModerate: boolean;
    canVote: boolean;
}
