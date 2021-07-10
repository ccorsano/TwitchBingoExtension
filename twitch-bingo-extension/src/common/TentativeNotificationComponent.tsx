import { Button } from "@material-ui/core"
import React from "react"
import { CountdownCircleTimer } from "react-countdown-circle-timer"
import { BingoEntry } from "../EBS/BingoService/EBSBingoTypes"

type TentativeNotificationComponentProps = {
    gameId: string,
    entry: BingoEntry,
    onExpire?: (entry: BingoEntry) => void,
    onConfirm: (entry: BingoEntry) => void,
    tentativeTime: Date,
    confirmationTimeout: number
}

const renderTime = ({remainingTime}) => {
    return `${remainingTime}`;
}

function delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
}

export default function TentativeNotificationComponent(props: TentativeNotificationComponentProps)
{
    const [isConfirmed, setConfirmed] = React.useState(false);

    const handleConfirm = (_event: React.MouseEvent<HTMLButtonElement>) => {
        props.onConfirm(props.entry);
        setConfirmed(true);
    };

    var duration: number = (props.tentativeTime.getTime() - Date.now()) + props.confirmationTimeout;

    delay(duration * 1000).then(() => {
        if (! isConfirmed && props.onExpire)
        {
            props.onExpire(props.entry);
        }
    });
    
    return (
        <div>
            <p>{props.entry.text}</p>
            <CountdownCircleTimer
                isPlaying
                size={50}
                strokeWidth={3}
                colors="#FFFFFF"
                duration={duration}
                children={renderTime}
            />
            <Button onClick={handleConfirm}>Confirm</Button>
        </div>
    )
}