import { EBSBase } from "../EBSBase";
import * as EBSConfig from "../EBSConfig";
import { BingoGame, BingoGameCreationParams, BingoGrid, BingoLogEntry, BingoTentative } from "./EBSBingoTypes";

export class EBSBingoService extends EBSBase {
    constructor(){
        super(EBSConfig.EBSBaseUrl);
    }

    createGame = (gameParams: BingoGameCreationParams): Promise<BingoGame> => {
        return this.servicePost("/game", gameParams);
    }

    getGame = (gameId: string): Promise<BingoGame> => {
        return this.serviceFetch("/game/" + encodeURI(gameId));
    }

    stopGame = (gameId: string): Promise<void> => {
        return this.serviceDelete("/game/" + encodeURI(gameId));
    }

    tentative = (gameId: string, entryKey: string): Promise<BingoTentative> => {
        return this.servicePost("/game/" + encodeURI(gameId) + "/" + encodeURI(entryKey) + "/tentative", {});
    }
    
    confirm = (gameId: string, entryKey: string): Promise<BingoTentative> => {
        return this.servicePost("/game/" + encodeURI(gameId) + "/" + encodeURI(entryKey) + "/confirm", {});
    }
    
    notify = (gameId: string, entryKey: string): Promise<void> => {
        return this.servicePost("/game/" + encodeURI(gameId) + "/" + encodeURI(entryKey) + "/notify", {});
    }

    getGrid = (gameId: string): Promise<BingoGrid> => {
        return this.serviceFetch("/game/" + encodeURI(gameId) + "/grid", {});
    }

    getGameLog = (gameId: string): Promise<BingoLogEntry[]> => {
        return this.serviceFetch("/game/" + encodeURI(gameId) + "/log", {});
    }
}

export const BingoEBS = new EBSBingoService();