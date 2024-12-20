import Divider from '@material-ui/core/Divider';
import Drawer from '@material-ui/core/Drawer';
import IconButton from '@material-ui/core/IconButton';
import ChevronLeft from '@material-ui/icons/ChevronLeft';
import React from 'react';
import ModerationBingoComponent from '../../common/ModerationBingoComponent';
import { BingoEBS } from '../../EBS/BingoService/EBSBingoService';
import { BingoConfirmationNotification, BingoEntry, BingoGame, BingoTentativeNotification } from '../../EBS/BingoService/EBSBingoTypes';
import { EBSError } from '../../EBS/EBSBase';

type ModerationPaneProps = {
    game: BingoGame,
    tentatives: BingoTentativeNotification[],
    isOpen: boolean,
    onOpen: () => void,
    onClose: (e: React.MouseEvent<any>) => void,
    isStarted: boolean,
    gameId: string,
    confirmationTimeout: number,
    onReceiveTentative?: (tentative: BingoTentativeNotification) => void,
    onReceiveConfirmation?: (confirmation: BingoConfirmationNotification) => void,
    onNotificationsEmpty?: () => void,
    onTentativeExpire?: (tentative: BingoTentativeNotification) => void,
}

export default function ModerationPane(props: ModerationPaneProps)
{
    const [autoOpened, setAutoOpened] = React.useState(false);
    const [entries, setEntries] = React.useState<BingoEntry[]>(new Array(0))

    React.useEffect(() => {
        if (autoOpened && props.tentatives.length == 0)
        {
            props.onNotificationsEmpty();
        }
    }, [props.tentatives, autoOpened])

    React.useEffect(() => {
        if (props.game?.entries)
        {
            setEntries(props.game.entries)
        }
    }, [props.game])

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

    const onTentativeExpire = React.useCallback((entry: BingoEntry) =>
    {
        console.log("Entry expired: " + entry.text + " Active tentatives: " + props.tentatives.length)
        const tentative = props.tentatives.find(t => t.key === entry.key)
        if (props.onTentativeExpire)
        {
            props.onTentativeExpire(tentative)
        }
    }, [props.tentatives])

    const onTestTentative = (entry: BingoEntry) => {
        var notification: BingoTentativeNotification = {
            gameId: props.gameId,
            key: entry.key,
            tentativeTime: new Date(Date.now())
        }
        props.onReceiveTentative(notification)
    }

    const onClose = (e: React.MouseEvent<any>) => {
        setAutoOpened(false);
        if (props.onNotificationsEmpty && props.tentatives.length == 0)
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
                    tentatives={props.tentatives}
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