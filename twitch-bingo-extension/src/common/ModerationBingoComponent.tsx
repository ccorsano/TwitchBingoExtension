import { Button, List, ListItem, ListItemSecondaryAction, ListItemText, Paper } from "@material-ui/core"
import React from "react"
import { BingoEBS } from "../EBS/BingoService/EBSBingoService"
import { BingoEntry, BingoTentativeNotification } from "../EBS/BingoService/EBSBingoTypes"
import { Twitch } from "../services/TwitchService"
import TentativeNotificationComponent from "./TentativeNotificationComponent"
import { TwitchExtHelper } from "./TwitchExtension"


type ModerationBingoComponentProps = {
    entries: BingoEntry[],
    isStarted: boolean,
    confirmationTimeout: number,
    onReceiveTentative?: (tentative: BingoTentativeNotification) => void,
}

export default function ModerationBingoComponent(props: ModerationBingoComponentProps)
{
    const [tentatives, setTentatives] = React.useState(new Array<BingoTentativeNotification>(0));

    React.useEffect(() => {
        Twitch.onAuthorized.push(_context => {
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
        });
    });

    var onConfirm = (entry: BingoEntry) => {
        BingoEBS.confirm(this.state.gameId, entry.key.toString());
        setTentatives(tentatives.filter(t => t.key != entry.key));
    };

    var onTentativeExpire = (entry: BingoEntry) => {
        setTentatives(tentatives.filter(t => t.key != entry.key));
    };

    return (
        <Paper elevation={3}>
            <List>
                {
                    tentatives.map((tentative) => {
                        if (tentative.key)
                        {
                            var entry: BingoEntry = props.entries.find(e => e.key == tentative.key);

                            return (
                                <TentativeNotificationComponent
                                    gameId={tentative.gameId}
                                    entry={entry}
                                    tentativeTime={tentative.tentativeTime}
                                    key={tentative.key}
                                    confirmationTimeout={props.confirmationTimeout}
                                    onConfirm={onConfirm}
                                    onExpire={onTentativeExpire}
                                />
                            );
                        }
                    })
                }
            </List>
            <List>
                {
                    props.entries.map((entry) => {
                        if (entry.key)

                        return (
                            <ListItem key={entry.key}>
                                <ListItemText primary={entry.text} />
                                <ListItemSecondaryAction>
                                    <Button aria-label="Confirm" onClick={(_) => onConfirm(entry)} variant="outlined">Confirm</Button>
                                </ListItemSecondaryAction>
                            </ListItem>
                        );
                    })
                }
            </List>
        </Paper>
    )
}