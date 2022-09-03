import React from "react";
import clsx from 'clsx';
import { BingoEntryState } from "../model/BingoEntry";
import { CountdownCircleTimer } from "react-countdown-circle-timer";
import type { BingoEntry, FormatTimeout } from "../EBS/BingoService/EBSBingoTypes";
import { I18nContext } from "../i18n/i18n-react";
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
    isShown: boolean
}

const renderTime = ({remainingTime}) => {
    return (
        <span className="countdownText">
            { FormatTimeout(remainingTime) }
        </span>
    );
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
            <div className={clsx("countdownPrompt", "bingoCellPrompt", "bingoCellPromptVisible")}>
                <div style={{ fontSize: '16px' }}>
                    <CountdownCircleTimer
                        isPlaying
                        size={70}
                        isLinearGradient={true}
                        duration={duration}
                        children={renderTime}
                        strokeWidth={12}
                        trailColor={"#F4A4BB"}
                        colors={"#EA4E7A"}
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
    const entryVariantType = `type${props.config.key % 10}`;

    return (
        <div className={clsx("entryGridCell", entryVariantType)}>
            <div className={clsx(
                                "bingoCell",
                                props.isShown ? "visibleCell" : "hiddenCell",
                                "paper",
                                stateClass,
                                props.isColCompleted ? "colConfirmed" : '',
                                props.isRowCompleted ? "rowConfirmed" : '')}
                onClickCapture={handlePrompt}>
                <div className={clsx("bingoCellOverlay", stateClass)}></div>
                <div className={clsx("bingoEntry")}>
                    <div className={clsx("bingoEntryText")} >
                        {props.config.text}
                    </div>
                </div>
                <div
                    className={clsx("bingoCellPrompt", confirmationPrompt ? "bingoCellPromptVisible" : "bingoCellPromptHidden")}
                    onClickCapture={(props.isShown && confirmationPrompt) ? handleTentative : null} >
                    {LL.BingoViewerEntry.ConfirmButtonLabel()}
                </div>
                { timerComponent }
            </div>
        </div>
    )
}
