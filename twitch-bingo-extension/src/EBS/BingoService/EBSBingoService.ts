import { EBSBase } from "../EBSBase";
import * as EBSConfig from "../EBSConfig";
import { BingoGame, BingoGameCreationParams, BingoGrid, BingoTentative } from "./EBSBingoTypes";

export class EBSBingoService extends EBSBase {
    constructor(){
        super(EBSConfig.EBSBaseUrl);
    }

    createGame = (gameParams: BingoGameCreationParams): Promise<BingoGame> => {
        return this.servicePost("/game", gameParams);
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

    getGrid = (gameId: string): Promise<BingoGrid> => {
        return this.serviceFetch("/game/" + encodeURI(gameId) + "/grid", {});
    }
}

export const BingoEBS = new EBSBingoService();