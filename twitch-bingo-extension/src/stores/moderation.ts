import type { BingoGameContext } from "../common/BingoGameContext";
import type { BingoGameModerationContext } from "../common/BingoGameModerationContext";
import type { BingoEntry, BingoGame, BingoTentativeNotification } from "../EBS/BingoService/EBSBingoTypes";
import { writable, type Writable } from "svelte/store";

const _defaultGameModerationContext: BingoGameModerationContext = {
    tentatives: new Array<BingoTentativeNotification>(0),
    onConfirm: (_e) => {},
    onTentativeExpire: (_e) => {},
    onTestTentative: (_e) => {},
    onForceNotify: (_e) => {},
}

export function createGameModerationContext() {
    return writable<BingoGameModerationContext>(_defaultGameModerationContext)
}

export function setTentatives(context: Writable<BingoGameModerationContext>, tentatives: BingoTentativeNotification[]) {
    context.update(c => {
        c.tentatives = tentatives
        return c
    })
}

export const GameModerationContextKey = Symbol()