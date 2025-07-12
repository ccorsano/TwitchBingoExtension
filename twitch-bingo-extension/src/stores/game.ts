import type { BingoGameContext } from "src/common/BingoGameContext";
import type { BingoEntry, BingoGame } from "src/EBS/BingoService/EBSBingoTypes";
import { writable, type Writable } from "svelte/store";

const _defaultGame: BingoGame = {
    gameId: "",
    channelId: "",
    entries: Array<BingoEntry>(0),
    rows: 0,
    columns: 0,
    confirmationThreshold: ""
}

const _defaultGameContext: BingoGameContext = {
    isStarted: false,
    isAuthorized: false,
    hasSharedIdentity: false,
    promptIdentity: () => {},
    game: undefined,
    onTentative: (entry: BingoEntry) => {},
    canModerate: false,
    canVote: false,
}

export function createGame() {
    return writable<BingoGame>(_defaultGame)
}

export function createGameContext() {
    return writable<BingoGameContext>(_defaultGameContext)
}

export function setGame(context: Writable<BingoGameContext>, game: BingoGame) {
    context.update(c => {
        c.game = game
        return c
    })
}

export const GameContextKey = Symbol()