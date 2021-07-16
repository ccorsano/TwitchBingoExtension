import Button from "@material-ui/core/Button"
import ButtonGroup from "@material-ui/core/ButtonGroup"
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction"
import ListItemText from "@material-ui/core/ListItemText"
import Paper from "@material-ui/core/Paper"
import React from "react"
import { BingoEntry, BingoTentativeNotification } from "../EBS/BingoService/EBSBingoTypes"
import { bingoStyles } from "./BingoStyles"
import TentativeNotificationComponent from "./TentativeNotificationComponent"


type ModerationBingoComponentProps = {
    entries: BingoEntry[],
    tentatives: BingoTentativeNotification[],
    isStarted: boolean,
    gameId: string,
    confirmationTimeout: number,
    onConfirm: (entry: BingoEntry) => void,
    onTentativeExpire: (entry: BingoEntry) => void,
    onTest? : (entry: BingoEntry) => void,
}

export default function ModerationBingoComponent(props: ModerationBingoComponentProps)
{
    const classes = bingoStyles();

    return (
        <Paper elevation={3}>
            <List>
                {
                    props.tentatives.map((tentative) => {
                        if (tentative)
                        {
                            var entry: BingoEntry = props.entries.find(e => e.key == tentative.key);
                            console.log("ModerationBingoComponent tentative key: " + tentative.key)

                            return (
                                <TentativeNotificationComponent
                                    gameId={tentative.gameId}
                                    entry={entry}
                                    isConfirmed={tentative.confirmationTime != null}
                                    referenceTime={tentative.confirmationTime ?? tentative.tentativeTime}
                                    key={tentative.key}
                                    confirmationTimeout={props.confirmationTimeout}
                                    onConfirm={props.onConfirm}
                                    onExpire={props.onTentativeExpire}
                                />
                            );
                        }
                        else
                        {
                            console.log("Empty tentative")
                        }
                    })
                }
            </List>
            <List>
                {
                    props.entries.map((entry) => {
                        const tentative = props.tentatives.find(t => t.key == entry.key)
                        if (tentative)
                        {
                            return null;
                        }

                        const isConfirmed = entry.confirmedAt != null;
                        
                        return (
                            <ListItem key={entry.key} className={isConfirmed ? classes.confirmed : classes.idle }>
                                <ListItemText primary={entry.text} />
                                <ListItemSecondaryAction>
                                    <ButtonGroup size="small">
                                        <Button aria-label="Confirm" onClick={(_) => props.onConfirm(entry)} disabled={isConfirmed}>Confirm</Button>
                                        {/* <Button aria-label="Test" onClick={(_) => {if (props.onTest) props.onTest(entry)}}>Test</Button> */}
                                    </ButtonGroup>
                                </ListItemSecondaryAction>
                            </ListItem>
                        );
                    })
                }
            </List>
        </Paper>
    )
}