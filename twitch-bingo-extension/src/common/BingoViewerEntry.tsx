import { Box, Button, CircularProgress, Paper, Typography } from "@material-ui/core";
import React from "react";
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { BingoEntryState } from "../model/BingoEntry";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { BingoEntry } from "../EBS/BingoService/EBSBingoTypes";

const useStyles = makeStyles({
    paper: {
        background: 'linear-gradient(45deg, rgba(255,255,255,0.8) 0%, rgba(200,200,200,0.8) 100%);',
        height: '95%',
    },
    idle: {

    },
    pending: {
        background: 'linear-gradient(45deg, rgba(122,196,255,1) 33%, rgba(38,214,255,0.8) 90%);',
    },
    confirmed: {
        background: 'linear-gradient(45deg, rgba(223,255,50,0.8) 33%, rgba(151,255,124,0.8) 90%);',
    },
    missed: {
        background: 'linear-gradient(90deg, rgba(180,180,180,0.8) 30%, rgba(128,128,128,0.8) 90%);',
    },
    rejected: {
        background: 'linear-gradient(90deg, rgba(224,129,129,0.8) 30%, rgba(227,79,79,0.8) 90%);',
    },
    colConfirmed: {
        borderLeftStyle: 'solid',
        borderLeftColor: 'black',
        borderRightStyle: 'solid',
        borderRightColor: 'black',
    },
    rowConfirmed: {
        borderTopStyle: 'solid',
        borderTopColor: 'black',
        borderBottomStyle: 'solid',
        borderBottomColor: 'black',
    }
  });

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
    const classes = useStyles();
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