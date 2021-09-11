import React from "react";
import clsx from 'clsx';
import { BingoEntryState } from "../model/BingoEntry";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import { BingoEntry, FormatTimeout } from "../EBS/BingoService/EBSBingoTypes";
import { I18nContext } from "../i18n/i18n-react";
import BingoCellRibbon from "./BingoCellRibbon";
import { getRGB, jasminePalette } from "./BingoThemes";
require('./BingoStyles.scss')
require('./BingoViewerEntry.scss')

type BingoViewerEntryProps = {
    config: BingoEntry,
    state: BingoEntryState,
    canInteract: boolean,
    canConfirm: boolean,
    isRowCompleted: boolean,
    isColCompleted: boolean,
    onTentative: (entry: BingoEntry) => void,
    countdown?: Date,
    fontSize: string,
    isShown: boolean,
}

const renderTime = ({remainingTime}) => {
    return FormatTimeout(remainingTime);
}

export default function BingoViewerEntry(props: BingoViewerEntryProps) {
    const { LL } = React.useContext(I18nContext)
    
    const [confirmationPrompt, setConfirmationPrompt] = React.useState(false);

    var showTimer: boolean = props.countdown != null;
    var timerComponent: React.ReactElement = null;
    if (showTimer)
    {
        var duration = (props.countdown.getTime() - Date.now()) / 1000;
        if (duration > 0)
        {
            timerComponent = 
            <div className={clsx("bingoCellPrompt", "bingoCellPromptVisible")} style={{cursor: "unset"}}>
                <div style={{ display: 'inline-block' }}>
                    <CountdownCircleTimer
                        isPlaying
                        size={50}
                        strokeWidth={3}
                        colors="#000"
                        isLinearGradient={true}
                        duration={duration}
                        children={renderTime}
                    />
                </div>
            </div>
        }
    }

    const handlePrompt = (_event: React.MouseEvent<HTMLElement>) => {
        if (! props.isShown)
        {
            return;
        }
        if (confirmationPrompt || props.state == BingoEntryState.Idle)
        {
            setConfirmationPrompt(! confirmationPrompt)
        }
    };

    const handleTentative = (_event: React.MouseEvent<HTMLElement>) => {
        props.onTentative(props.config)
        setConfirmationPrompt(false)
    };

    let stateClass = confirmationPrompt ? "prompt" : "idle";
    switch(props.state)
    {
        case BingoEntryState.Confirmed:
            stateClass = "confirmed";
            break;
        case BingoEntryState.Missed:
            stateClass = "missed";
            break;
        case BingoEntryState.Pending:
            stateClass = "pending";
            break;
        case BingoEntryState.Rejected:
            stateClass = "rejected";
            break;
        default:
            break;
    }

    var ribbon = null;
    if (props.state == BingoEntryState.Missed || props.state == BingoEntryState.Rejected)
    {
        ribbon = (
            <div style={{ position: "absolute", top: "0px", right:"0px", maxWidth:"25%", maxHeight: "25%" }}>
                <BingoCellRibbon fillColor={getRGB(jasminePalette.base)} width="100%" height="100%" text={LL.BingoViewerEntry.MissedRibbonLabel()} />
            </div>
        )
    }

    return (
        <div className={clsx(
                            "bingoCell",
                            props.isShown ? "visibleCell" : "hiddenCell",
                            "paper",
                            stateClass,
                            props.isColCompleted ? "colConfirmed" : '',
                            props.isRowCompleted ? "rowConfirmed" : '')}
             onClickCapture={handlePrompt}>
            <div className={clsx("bingoEntry")}>
                <div style={{fontSize: props.fontSize}}>
                    {props.config.text}
                </div>
            </div>
            <div
                className={clsx("bingoCellPrompt", confirmationPrompt ? "bingoCellPromptVisible" : "bingoCellPromptHidden")}
                onClickCapture={(props.isShown && confirmationPrompt) ? handleTentative : null}
                style={{fontSize: props.fontSize}} >
                {LL.BingoViewerEntry.ConfirmButtonLabel()}
            </div>
            { timerComponent }
            { ribbon }
        </div>
    )
}