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

    tentative = (gameId: string, entryKey: string): Promise<BingoTentative> => {
        return this.servicePost("/game/" + gameId + "/" + entryKey + "/tentative", {});
    }
    
    confirm = (gameId: string, entryKey: string): Promise<BingoTentative> => {
        return this.servicePost("/game/" + gameId + "/" + entryKey + "/confirm", {});
    }

    getGrid = (gameId: string): Promise<BingoGrid> => {
        return this.serviceFetch("/game/" + gameId + "/grid", {});
    }
}

export const BingoEBS = new EBSBingoService();