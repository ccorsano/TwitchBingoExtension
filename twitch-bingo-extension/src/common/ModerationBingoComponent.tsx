import Box from "@material-ui/core/Box"
import Button from "@material-ui/core/Button"
import ButtonGroup from "@material-ui/core/ButtonGroup"
import LinearProgress from "@material-ui/core/LinearProgress"
import Paper from "@material-ui/core/Paper"
import React from "react"
import { BingoEntry, BingoTentativeNotification } from "../EBS/BingoService/EBSBingoTypes"
import { I18nContext } from "../i18n/i18n-react"
import { ActiveGameModerationContext } from "./BingoGameModerationComponent"
import { bingoStyles } from "./BingoStyles"
import TentativeNotificationComponent from "./TentativeNotificationComponent"
import { TwitchExtQuery } from "./TwitchExtension"


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
    const { LL } = React.useContext(I18nContext)
    const moderationContext = React.useContext(ActiveGameModerationContext)
    
    const classes = bingoStyles();

    const onTest = (entry: BingoEntry) => {
        moderationContext.onTestTentative(entry)
        if (props.onTest) props.onTest(entry)
    }

    return (
        <Paper elevation={3}>
            <div>
                {
                    props.tentatives.map((tentative) => {
                        if (tentative)
                        {
                            var entry: BingoEntry = props.entries.find(e => e.key == tentative.key);

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
                    })
                }
            </div>
            <div>
                {
                    props.entries?.length > 0 ?
                        props.entries.map((entry) => {
                            const tentative = props.tentatives.find(t => t.key == entry.key)
                            if (tentative)
                            {
                                return null;
                            }

                            const isConfirmed = entry.confirmedAt != null;
                            
                            return (
                                <div key={entry.key} className={isConfirmed ? classes.confirmed : classes.idle } style={{display: 'grid', gridAutoColumns: '1fr auto', padding: '0.5rem'}}>
                                    <div style={{gridColumn: 1, display: 'inline-grid'}}>
                                        {entry.text}
                                    </div>
                                    <div style={{gridColumn: 2, display: 'inline-grid', paddingLeft: '0.5rem'}}>
                                        <ButtonGroup size="small" style={{display:'inline-block'}}>
                                            <Button aria-label={LL.BingoModeration.ConfirmButtonLabel()} onClick={(_) => props.onConfirm(entry)} disabled={isConfirmed}>{LL.BingoModeration.ConfirmButton()}</Button>
                                            { TwitchExtQuery.state === "testing" ? <Button aria-label="Test" onClick={(_) => onTest(entry)}>Test</Button> : null }
                                        </ButtonGroup>
                                    </div>
                                </div>
                            );
                        })
                    :<Box style={{ margin: '1vw' }}>
                        <LinearProgress variant="indeterminate" />
                        {LL.BingoModeration.NoEntriesMessage()}
                    </Box>
                }
            </div>
        </Paper>
    )
}