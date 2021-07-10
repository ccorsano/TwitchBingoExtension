import { Divider, Drawer, IconButton } from '@material-ui/core';
import { ChevronLeft } from '@material-ui/icons';
import React from 'react';
import ModerationBingoComponent from '../../common/ModerationBingoComponent';
import { TwitchExtHelper } from '../../common/TwitchExtension';
import { BingoEBS } from '../../EBS/BingoService/EBSBingoService';
import { BingoEntry, BingoTentativeNotification } from '../../EBS/BingoService/EBSBingoTypes';

type ModerationPaneProps = {
    isOpen: boolean,
    onOpen: () => void,
    onClose: (e: React.MouseEvent<any>) => void,
    entries: BingoEntry[],
    isStarted: boolean,
    gameId: string,
    confirmationTimeout: number,
    onReceiveTentative?: (tentative: BingoTentativeNotification) => void,
}

export default function ModerationPane(props: ModerationPaneProps)
{
    const [tentatives, setTentatives] = React.useState(new Array<BingoTentativeNotification>(0));
    const [hasRegistered, setRegistered] = React.useState(false);

    React.useEffect(() => {
        if (! hasRegistered)
        {
            console.log(`Registering listener for ${'whisper-' + TwitchExtHelper.viewer.opaqueId}`);
            TwitchExtHelper.listen('whisper-' + TwitchExtHelper.viewer.opaqueId, (_target, _contentType, messageStr) => {
                console.log(`Received whisper for ${'whisper-' + TwitchExtHelper.viewer.opaqueId} ${messageStr}`);
                let message = JSON.parse(messageStr);
                switch (message.type) {
                    case 'tentative':
                        var notification = message.payload as BingoTentativeNotification;
                        setTentatives([...tentatives, notification])
                        if (props.onReceiveTentative)
                        {
                            props.onReceiveTentative(notification);
                        }
                        break;
                    default:
                        break;
                }
            });
            setRegistered(true);
        }
    });
    
    var onConfirm = (entry: BingoEntry) => {
        BingoEBS.confirm(props.gameId, entry.key.toString()).then(() => {
            setTentatives(tentatives.filter(t => t.key != entry.key));
        });
    };

    var onTentativeExpire = (entry: BingoEntry) => {
        setTentatives(tentatives.filter(t => t.key != entry.key));
    };

    return (
        <React.Fragment>
            <Drawer variant="temporary" anchor="left" open={props.isOpen}>
                <div>
                <IconButton onClick={props.onClose}>
                    <ChevronLeft />
                </IconButton>
                </div>
                <Divider />
                <ModerationBingoComponent
                    entries={props.entries}
                    tentatives={tentatives}
                    isStarted={props.isStarted}
                    gameId={props.gameId}
                    confirmationTimeout={props.confirmationTimeout}
                    onConfirm={onConfirm}
                    onTentativeExpire={onTentativeExpire} />
            </Drawer>
        </React.Fragment>
    );
}