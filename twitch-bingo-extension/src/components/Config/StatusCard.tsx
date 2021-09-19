import { Box, IconButton, LinearProgress } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Typography from '@material-ui/core/Typography'
import React from 'react'
import { BingoEntry, BingoLogEntry } from '../../EBS/BingoService/EBSBingoTypes'
import { I18nContext } from '../../i18n/i18n-react'
import GameLogView from './GameLogView'
import RefreshIcon from '@material-ui/icons/Refresh'

type StatusCardProps = {
    isLoading: boolean;
    isActive: boolean;
    entries: BingoEntry[];
    logEntries: BingoLogEntry[];
    isLoadingLog: boolean;
    onRefreshLog: () => void;
    onStop: () => void;
}

export default function StatusCard(props: StatusCardProps)
{
    const { LL } = React.useContext(I18nContext)

    return (
        <Card>
            <CardHeader title={LL.Config.StatusCard.Title()} />
            <CardContent>
                {
                    props.isLoading ?
                        <Box style={{ margin: '1vw' }}>
                            <LinearProgress variant="indeterminate" />
                            <Typography align='center'>{LL.Config.StatusCard.LoadingConfiguration()}</Typography>
                        </Box> :
                            props.isActive === true ?
                            <Typography variant="h5" component="h2">{LL.Config.StatusCard.StatusActive()}</Typography> :
                            <Typography variant="h5" component="h2">{LL.Config.StatusCard.StatusInactive()}</Typography>
                }
            </CardContent>
            <CardActions>
                {
                    props.isActive ? <Button variant="contained" color="secondary" onClick={props.onStop}>{LL.Config.StatusCard.StopButton()}</Button> : null
                }
            </CardActions>
            <CardContent>
                {
                    (!props.isLoading && props.isActive) ? (
                        <React.Fragment>
                            <Typography gutterBottom variant="h5" component="h2">
                                {LL.Config.GameLog.Header()}
                                <IconButton onClick={props.onRefreshLog} disabled={props.isLoadingLog}>
                                    <RefreshIcon />
                                </IconButton>
                            </Typography>
                            <GameLogView
                                isLoading={props.isLoadingLog && props.logEntries.length == 0}
                                entries={props.entries}
                                logEntries={props.logEntries} />
                        </React.Fragment>
                    ) : null
                }
            </CardContent>
        </Card>
    )
}