import { Button, List, ListItem, ListItemSecondaryAction, ListItemText, Paper } from "@material-ui/core"
import React from "react"
import { BingoEntry, BingoTentativeNotification } from "../EBS/BingoService/EBSBingoTypes"
import TentativeNotificationComponent from "./TentativeNotificationComponent"


type ModerationBingoComponentProps = {
    entries: BingoEntry[],
    tentatives: BingoTentativeNotification[],
    isStarted: boolean,
    gameId: string,
    confirmationTimeout: number,
    onConfirm: (entry: BingoEntry) => void,
    onTentativeExpire: (entry: BingoEntry) => void,
}

export default function ModerationBingoComponent(props: ModerationBingoComponentProps)
{
    return (
        <Paper elevation={3}>
            <List>
                {
                    props.tentatives.map((tentative) => {
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
                                    onConfirm={props.onConfirm}
                                    onExpire={props.onTentativeExpire}
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
                                    <Button aria-label="Confirm" onClick={(_) => props.onConfirm(entry)} variant="outlined">Confirm</Button>
                                </ListItemSecondaryAction>
                            </ListItem>
                        );
                    })
                }
            </List>
        </Paper>
    )
}