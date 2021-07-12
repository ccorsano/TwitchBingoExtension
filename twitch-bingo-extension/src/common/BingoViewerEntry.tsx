import { Box, Button, CircularProgress, Paper, Typography } from "@material-ui/core";
import React from "react";
import clsx from 'clsx';
import { BingoEntryState } from "../model/BingoEntry";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { BingoEntry } from "../EBS/BingoService/EBSBingoTypes";
import { bingoStyles } from "./BingoStyles";

type BingoViewerEntryProps = {
    config: BingoEntry,
    state: BingoEntryState,
    canInteract: boolean,
    canConfirm: boolean,
    isRowCompleted: boolean,
    isColCompleted: boolean,
    onTentative: (entry: BingoEntry) => void,
    countdown?: Date,
}

const renderTime = ({remainingTime}) => {
    return `${remainingTime}`;
}

export default function BingoViewerEntry(props: BingoViewerEntryProps) {
    const classes = bingoStyles();
    console.log("BingoViewerEntry " +  props.config.key + " countdown: " + props.countdown?.getTime() + "now: " + Date.now());

    var showTimer: boolean = props.countdown != null;
    var timerComponent: React.ReactElement = null;
    if (showTimer)
    {
        var duration = (props.countdown.getTime() - Date.now()) / 1000;
        console.log("Updating cell " + props.config.key + " with timer: " + duration)
        if (duration > 0)
        {
            timerComponent = <CountdownCircleTimer
                isPlaying
                size={50}
                strokeWidth={3}
                colors="#FFFFFF"
                duration={duration}
                children={renderTime}
            />
        }
        else
        {
            timerComponent = <CircularProgress/>
        }
    }

    const handleTentative = (_event: React.MouseEvent<HTMLButtonElement>) => {
        props.onTentative(props.config);
    };

    let stateClass = classes.idle;
    switch(props.state)
    {
        case BingoEntryState.Confirmed:
            stateClass = classes.confirmed;
            break;
        case BingoEntryState.Missed:
            stateClass = classes.missed;
            break;
        case BingoEntryState.Pending:
            stateClass = classes.pending;
            break;
        case BingoEntryState.Rejected:
            stateClass = classes.rejected;
            break;
        default:
            break;
    }

    return (
        <Paper elevation={3} className={clsx(classes.paper, stateClass, props.isColCompleted ? classes.colConfirmed : '', props.isRowCompleted ? classes.rowConfirmed : '')}>
            <Box py={3} my={0.5} px={2}>
                <Typography>
                    {props.config.text}
                </Typography>
                { timerComponent }
                { props.canInteract ? <Button onClick={handleTentative}>Bingo !</Button> : null}
            </Box>
        </Paper>
    )
}