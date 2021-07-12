import { Button, ListItem, ListItemIcon, ListItemSecondaryAction, ListItemText } from "@material-ui/core"
import React from "react"
import clsx from 'clsx'
import { CountdownCircleTimer } from "react-countdown-circle-timer"
import { BingoEntry } from "../EBS/BingoService/EBSBingoTypes"
import { bingoStyles } from "./BingoStyles"

type TentativeNotificationComponentProps = {
    gameId: string,
    entry: BingoEntry,
    onExpire?: (entry: BingoEntry) => void,
    onConfirm: (entry: BingoEntry) => void,
    tentativeTime: Date,
    confirmationTimeout: number
}

export default function TentativeNotificationComponent(props: TentativeNotificationComponentProps)
{
    const [isConfirmed, setConfirmed] = React.useState(false);
    const [referenceTime, setReferenceTime] = React.useState<Date>(props.tentativeTime);
    const classes = bingoStyles();

    const handleConfirm = (_event: React.MouseEvent<HTMLButtonElement>) => {
        props.onConfirm(props.entry)
        setConfirmed(true)
        setReferenceTime(new Date())
    };

    var duration: number = (referenceTime.getTime() - Date.now()) + props.confirmationTimeout;
    
    return (
        <ListItem key={props.entry.key} className={clsx(isConfirmed ? classes.confirmed : classes.pending)}>
            <ListItemIcon>
                <CountdownCircleTimer
                    isPlaying
                    key={isConfirmed ? "pre-confirmation" : "post-confirmation" }
                    size={40}
                    strokeWidth={2}
                    colors={ isConfirmed ? "#000" : "#FFF" }
                    duration={duration/1000}
                    children={renderTime}
                    onComplete={ (_elapsed) => {
                        if (! isConfirmed)
                        {
                            if (props.onExpire) props.onExpire(props.entry)
                        }
                        else
                        {
                            if (props.onExpire) props.onExpire(props.entry)
                        }
                    }}
                />
            </ListItemIcon>
            <ListItemText primary={props.entry.text}  />
            <ListItemSecondaryAction>
                <Button onClick={handleConfirm} disabled={isConfirmed}>Confirm</Button>
            </ListItemSecondaryAction>
        </ListItem>
    )
}

const renderTime = ({remainingTime}) => {
    return `${remainingTime}`;
}