import Button from "@material-ui/core/Button"
import React from "react"
import clsx from 'clsx'
import { CountdownCircleTimer } from "react-countdown-circle-timer"
import { BingoEntry } from "../EBS/BingoService/EBSBingoTypes"
import { bingoStyles } from "./BingoStyles"
import { I18nContext } from "../i18n/i18n-react"

type TentativeNotificationComponentProps = {
    gameId: string,
    entry: BingoEntry,
    onExpire?: (entry: BingoEntry) => void,
    onConfirm: (entry: BingoEntry) => void,
    referenceTime: Date,
    confirmationTimeout: number,
    isConfirmed: boolean,
}

export default function TentativeNotificationComponent(props: TentativeNotificationComponentProps)
{
    const { LL } = React.useContext(I18nContext)

    const [isConfirmed, setConfirmed] = React.useState(props.isConfirmed);
    const [referenceTime, setReferenceTime] = React.useState<Date>(props.referenceTime);
    const classes = bingoStyles();

    const handleConfirm = (_event: React.MouseEvent<HTMLButtonElement>) => {
        props.onConfirm(props.entry)
        setConfirmed(true)
        setReferenceTime(new Date())
    };

    // console.log(`TentativeNotificationComponent: ${props.confirmationTimeout}`)
    var duration: number = (referenceTime.getTime() - Date.now()) + props.confirmationTimeout;
    
    return (
        <div key={props.entry.key} className={clsx(isConfirmed ? classes.confirmed : classes.pending)} style={{display: 'grid', gridAutoColumns: 'auto 1fr auto', padding: '0.5rem'}}>
            <div style={{gridColumn: 1, display: 'inline-grid', paddingRight: '1rem'}}>
                <CountdownCircleTimer
                    isPlaying
                    key={isConfirmed ? "pre-confirmation" : "post-confirmation" }
                    size={40}
                    strokeWidth={2}
                    colors="#000"
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
            </div>
            <div style={{gridColumn: 2, display: 'inline-grid', alignSelf: 'center'}}>
                {props.entry.text}
            </div>
            <div style={{gridColumn: 3, display: 'inline-grid'}}>
                <Button aria-label={LL.BingoModeration.ConfirmButtonLabel()} onClick={handleConfirm} disabled={isConfirmed}>{LL.BingoModeration.ConfirmButton()}</Button>
            </div>
        </div>
    )
}

const renderTime = ({remainingTime}) => {
    return `${remainingTime}`;
}