import CircularProgress from "@material-ui/core/CircularProgress";
import Check from "@material-ui/icons/Check";
import React from "react";
import clsx from 'clsx';
import { BingoEntryState } from "../model/BingoEntry";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { BingoEntry } from "../EBS/BingoService/EBSBingoTypes";
import { bingoStyles } from "./BingoStyles";
import Button from "@material-ui/core/Button";

type BingoViewerEntryProps = {
    config: BingoEntry,
    state: BingoEntryState,
    canInteract: boolean,
    canConfirm: boolean,
    isRowCompleted: boolean,
    isColCompleted: boolean,
    onTentative: (entry: BingoEntry) => void,
    countdown?: Date,
    fontSize: string
}

const renderTime = ({remainingTime}) => {
    return `${remainingTime}`;
}

export default function BingoViewerEntry(props: BingoViewerEntryProps) {
    const classes = bingoStyles();
    const [confirmationPrompt, setConfirmationPrompt] = React.useState(false);

    // console.log("BingoViewerEntry " +  props.config.key + " countdown: " + props.countdown?.getTime() + " now: " + Date.now());

    var showTimer: boolean = props.countdown != null;
    var timerComponent: React.ReactElement = null;
    if (showTimer)
    {
        var duration = (props.countdown.getTime() - Date.now()) / 1000;
        // console.log("Updating cell " + props.config.key + " with timer: " + duration)
        if (duration > 0)
        {
            timerComponent = 
            <div style={{ display: 'inline-block' }}>
                <CountdownCircleTimer
                    isPlaying
                    size={50}
                    strokeWidth={3}
                    colors="#FFFFFF"
                    duration={duration}
                    children={renderTime}
                />
            </div>
        }
        else
        {
            timerComponent = <CircularProgress />
        }
    }

    const handlePrompt = (_event: React.MouseEvent<HTMLElement>) => {
        if (confirmationPrompt || props.state == BingoEntryState.Idle)
        {
            setConfirmationPrompt(! confirmationPrompt)
        }
    };

    const handleTentative = (_event: React.MouseEvent<HTMLElement>) => {
        props.onTentative(props.config)
        setConfirmationPrompt(false)
    };

    let stateClass = confirmationPrompt ? classes.prompt : classes.idle;
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
        <div className={clsx(classes.paper, stateClass, props.isColCompleted ? classes.colConfirmed : '', props.isRowCompleted ? classes.rowConfirmed : '')} onClick={handlePrompt}>
            <div className={clsx(classes.bingoEntry)}>
                <div style={{fontSize: props.fontSize}}>
                    {props.config.text}
                </div>
            </div>
            {
                confirmationPrompt ?
                    <Button aria-label="Confirm" onClickCapture={handleTentative} variant="outlined" color="primary" size="large">
                        <Check color="action" />
                    </Button> : null
            }
            { timerComponent }
        </div>
    )
}