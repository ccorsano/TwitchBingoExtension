import { LinearProgress, ListItem, ListItemIcon, ListItemText, Typography } from '@material-ui/core';
import List from '@material-ui/core/List';
import dayjs, { Dayjs } from 'dayjs';
import React from 'react'
import { BingoEntry, BingoLogEntry, NotificationType } from "../../EBS/BingoService/EBSBingoTypes";
import { I18nContext } from '../../i18n/i18n-react';
import CheckCircleIcon from '@material-ui/icons/CheckCircle'
import BorderVerticalIcon from '@material-ui/icons/BorderVertical'
import BorderHorizontalIcon from '@material-ui/icons/BorderHorizontal'
import BorderAllIcon from '@material-ui/icons/BorderAll'

type GameLogViewProps = {
    entries: BingoEntry[],
    logEntries: BingoLogEntry[],
    isLoading: boolean,
}

export default function GameLogView(props: GameLogViewProps)
{
    const { LL } = React.useContext(I18nContext)
    const timeFormat = 'YYYY-MM-DD HH:mm:ss (Z)'

    var confirmation = (index: number, entry: BingoEntry, log: BingoLogEntry, parsedTime: Dayjs) => (
        <ListItem key={index}>
            <ListItemIcon>
                <CheckCircleIcon />
            </ListItemIcon>
            <ListItemText secondary={parsedTime.format(timeFormat)}>
                <Typography variant="body2">
                    {LL.Config.GameLog.ConfirmationText({entryKey: entry.key, entryText: entry.text, playerNames: log.playerNames})}
                </Typography>
            </ListItemText>
        </ListItem>
    )

    var column = (index: number, entry: BingoEntry, log: BingoLogEntry, parsedTime: Dayjs) => (
        <ListItem key={index}>
            <ListItemIcon>
                <BorderVerticalIcon />
            </ListItemIcon>
            <ListItemText secondary={parsedTime.format(timeFormat)}>
                <Typography variant="body2">
                    {LL.Config.GameLog.CompletedColText({entryKey: entry.key, playersCount: log.playersCount})}
                </Typography>
            </ListItemText>
        </ListItem>
    )

    var row = (index: number, entry: BingoEntry, log: BingoLogEntry, parsedTime: Dayjs) => (
        <ListItem key={index}>
            <ListItemIcon>
                <BorderHorizontalIcon />
            </ListItemIcon>
            <ListItemText secondary={parsedTime.format(timeFormat)}>
                <Typography variant="body2">
                    {LL.Config.GameLog.CompletedRowText({entryKey: entry.key, playersCount: log.playersCount})}
                </Typography>
            </ListItemText>
        </ListItem>
    )

    var grid = (index: number, entry: BingoEntry, log: BingoLogEntry, parsedTime: Dayjs) => (
        <ListItem key={index}>
            <ListItemIcon>
                <BorderAllIcon />
            </ListItemIcon>
            <ListItemText secondary={parsedTime.format(timeFormat)}>
                <Typography variant="body2">
                    {LL.Config.GameLog.CompletedGridText({entryKey: entry.key, playersCount: log.playersCount})}
                </Typography>
            </ListItemText>
        </ListItem>
    )

    return props.isLoading ?
        (
            <LinearProgress variant='indeterminate' />
        ) :
        (
            <List classes={{
                root: "gameLogList"
            }}>
            {
                props.logEntries.map((log, index) => {
                    var entry: BingoEntry = props.entries.find(e => e.key === log.key)
                    var logTime = dayjs(log.timestamp)
    
                    switch (log.type) {
                        case NotificationType.Confirmation:
                            return confirmation(index, entry, log, logTime)
                        case NotificationType.CompletedColumn:
                            return column(index, entry, log, logTime)
                        case NotificationType.CompletedRow:
                            return row(index, entry, log, logTime)
                        case NotificationType.CompletedGrid:
                            return grid(index, entry, log, logTime)
                        default:
                            break;
                    }
                    return null
                })
            }
            </List>
        )
}