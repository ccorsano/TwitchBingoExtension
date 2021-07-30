import React from "react"
import { BingoEBS } from "../EBS/BingoService/EBSBingoService"
import { BingoConfirmationNotification, BingoEntry, BingoGame, BingoTentativeNotification } from "../EBS/BingoService/EBSBingoTypes"
import { EBSError } from "../EBS/EBSBase"
import { ActiveGameContext } from "./BingoGameComponent"
import { BingoGameModerationContext } from "./BingoGameModerationContext"
import { TwitchExtHelper } from "./TwitchExtension"


export const ActiveGameModerationContext = React.createContext<BingoGameModerationContext>(null)

type BingoGameModerationComponentProps = {
    children?: React.ReactNode,
    activeGame?: BingoGame,
    onReceiveTentative?: (tentative: BingoTentativeNotification) => void,
    onReceiveConfirmation?: (confirmation: BingoConfirmationNotification) => void,
    onNotificationsEmpty?: () => void,
}

export default function BingoGameModerationComponent(props: BingoGameModerationComponentProps)
{
    const context = React.useContext(ActiveGameContext)

    const [tentatives, setTentatives] = React.useState(new Array<BingoTentativeNotification>(0));

    const receiveTentative = (notification: BingoTentativeNotification) => {
        setTentatives(currentTentatives => {
            // Skip if a tentative is already pending for this key
            if (currentTentatives.some(t => t.gameId == notification.gameId && t.key == notification.key))
            {
                console.log("Skipped adding tentative " + notification.gameId + " " + notification.key)
                return currentTentatives
            }
            console.log("Adding tentative " + notification.gameId + " " + notification.key + " to set of " + currentTentatives.length)
            return [...currentTentatives, notification]
        })
        if (props.onReceiveTentative)
        {
            props.onReceiveTentative(notification);
        }
    }

    const receiveConfirmation = (confirmation: BingoConfirmationNotification) => {
        setTentatives(currentTentatives => {
            return currentTentatives.map(tentative => {
                if (tentative.gameId == confirmation.gameId && tentative.key == confirmation.key)
                {
                    return {
                        gameId: tentative.gameId,
                        key: tentative.key,
                        tentativeTime: tentative.tentativeTime,
                        confirmationTime: confirmation.confirmationTime,
                        confirmedBy: confirmation.confirmedBy
                    }
                }
                return tentative
            })
        })
    }

    const onReceiveWhisper = (_target, _contentType, messageStr) => {
        console.log(`Received whisper for ${'whisper-' + TwitchExtHelper.viewer.opaqueId} ${messageStr}`);
        let message = JSON.parse(messageStr, (key, value) => {
            if (key == "tentativeTime" || key == "confirmationTime")
            {
                return new Date(value);
            }
            return value;
        });
        switch (message.type) {
            case 'tentative':
                var notification = message.payload as BingoTentativeNotification;
                receiveTentative(notification);
                break;
            case 'confirm':
                var confirm = message.payload as BingoConfirmationNotification;
                console.log("Received notification of confirmation of key " + confirm.key + " by " + confirm.confirmedBy)
                receiveConfirmation(confirm);
                break;
            default:
                break;
        }
    }

    React.useEffect(() => {
        console.log(`Registering listener for ${'whisper-' + TwitchExtHelper.viewer.opaqueId}`)

        TwitchExtHelper.listen('whisper-' + TwitchExtHelper.viewer.opaqueId, onReceiveWhisper)
        return () => {
            console.log(`Unregistering listener for ${'whisper-' + TwitchExtHelper.viewer.opaqueId}`)
            TwitchExtHelper.unlisten('whisper-' + TwitchExtHelper.viewer.opaqueId, onReceiveWhisper)
        }
    }, [])

    React.useEffect(() => {
        if (tentatives.length == 0)
        {
            props.onNotificationsEmpty();
        }
    }, [tentatives])

    const processTentative = (entry: BingoEntry) =>
    {
        console.log("Confirmed tentative for key " + entry.key)
    }
    
    const onConfirm = (game: BingoGame, entry: BingoEntry) => {
        BingoEBS.confirm(game.gameId, entry.key.toString()).then(() => {
            processTentative(entry)
        }, (reason: EBSError) => {
            // If entry was already confirmed, consider it done
            if (reason.status == 409)
            {
                processTentative(entry)
            }
            else
            {
                throw reason
            }
        })
    }

    const onTentativeExpire = (entry: BingoEntry) =>
    {
        console.log("Entry expired: " + entry.text + " Active tentatives: " + tentatives.length)
        setTentatives(tentatives.filter(t => t.key != entry.key));
    }

    const onTestTentative = (game: BingoGame, entry: BingoEntry) => {
        var notification: BingoTentativeNotification = {
            gameId: game.gameId,
            key: entry.key,
            tentativeTime: new Date(Date.now())
        }
        receiveTentative(notification)
    }

    return (
        <ActiveGameModerationContext.Provider value={
                {
                    gameContext: context,
                    tentatives: tentatives,
                    onConfirm: entry => onConfirm(context.game, entry),
                    onTentativeExpire: entry => onTentativeExpire(entry),
                    onTestTentative: entry => onTestTentative(context.game, entry),
                }
            }>
            { props.children }
        </ActiveGameModerationContext.Provider>
    )
}