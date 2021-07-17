import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import React from 'react';
import ModerationBingoComponent from '../../common/ModerationBingoComponent';
import { TwitchExtHelper } from '../../common/TwitchExtension';
import { BingoEBS } from '../../EBS/BingoService/EBSBingoService';
import { BingoConfirmationNotification, BingoEntry, BingoTentativeNotification } from '../../EBS/BingoService/EBSBingoTypes';
import { EBSError } from '../../EBS/EBSBase';

type ModerationPaneProps = {
    isOpen: boolean,
    onOpen: () => void,
    onClose: (e: React.MouseEvent<any>) => void,
    isStarted: boolean,
    gameId: string,
    confirmationTimeout: number,
    onReceiveTentative?: (tentative: BingoTentativeNotification) => void,
    onReceiveConfirmation?: (confirmation: BingoConfirmationNotification) => void,
    onNotificationsEmpty?: () => void,
}

export default function ModerationPane(props: ModerationPaneProps)
{
    const [tentatives, setTentatives] = React.useState(new Array<BingoTentativeNotification>(0));
    const [autoOpened, setAutoOpened] = React.useState(false);
    const [entries, setEntries] = React.useState<BingoEntry[]>(new Array(0));

    const refreshEntries = (gameId: string) => {
        BingoEBS.getGame(gameId).then(game => {
            setEntries(game.entries)
        })
    }

    React.useEffect(() => {
        if (props.gameId)
        {
            refreshEntries(props.gameId)
        }
    }, [props.gameId])

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
            setAutoOpened(true);
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
        refreshEntries(confirmation.gameId)
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
        if (autoOpened && tentatives.length == 0)
        {
            props.onNotificationsEmpty();
        }
    }, [tentatives, autoOpened])

    const processTentative = (entry: BingoEntry) =>
    {
        console.log("Confirmed tentative for key " + entry.key)
    }
    
    const onConfirm = (entry: BingoEntry) => {
        BingoEBS.confirm(props.gameId, entry.key.toString()).then(() => {
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

    const onTestTentative = (entry: BingoEntry) => {
        var notification: BingoTentativeNotification = {
            gameId: props.gameId,
            key: entry.key,
            tentativeTime: new Date(Date.now())
        }
        receiveTentative(notification)
    }

    const onClose = (e: React.MouseEvent<any>) => {
        setAutoOpened(false);
        if (props.onNotificationsEmpty && tentatives.length == 0)
        {
            props.onNotificationsEmpty();
        }
        return props.onClose(e);
    }

    return (
        <React.Fragment>
            <Drawer variant="temporary" anchor="left" open={props.isOpen}>
                <div>
                <IconButton onClick={onClose}>
                    <ChevronLeft />
                </IconButton>
                </div>
                <Divider />
                <ModerationBingoComponent
                    entries={entries}
                    tentatives={tentatives}
                    isStarted={props.isStarted}
                    gameId={props.gameId}
                    confirmationTimeout={props.confirmationTimeout}
                    onConfirm={onConfirm}
                    onTentativeExpire={onTentativeExpire}
                    onTest={onTestTentative} />
            </Drawer>
        </React.Fragment>
    );
}