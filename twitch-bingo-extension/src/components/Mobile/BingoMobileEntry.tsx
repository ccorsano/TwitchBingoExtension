import React from 'react'
import clsx from 'clsx';
import { I18nContext } from '../../i18n/i18n-react';
import { BingoEntryState, BingoGridCell } from '../../model/BingoEntry';
import { CountdownCircleTimer } from 'react-countdown-circle-timer';
import { FormatTimeout } from '../../EBS/BingoService/EBSBingoTypes';

type BingoMobileEntryProps = {
    cell: BingoGridCell,
    isSelected: boolean,
    onSelect: (key: number) => void,
    onConfirm: (key: number) => void,
}

const renderTime = ({remainingTime}) => (
    <span style={{fontSize:'14px'}}>
        {FormatTimeout(remainingTime)}
    </span>
)

const BingoMobileEntry = React.forwardRef<HTMLDivElement, BingoMobileEntryProps>((props: BingoMobileEntryProps, ref: React.ForwardedRef<HTMLDivElement>) => 
{
    const { LL } = React.useContext(I18nContext)
    
    const [isPrompting, setPrompting] = React.useState(false)
    const isCurrentElementActive = props.isSelected && props.cell.state == BingoEntryState.Idle

    React.useEffect(() => {
        if (! props.isSelected && isPrompting)
        {
            setPrompting(false)
        }
    }, [props.isSelected, isPrompting])

    var bClass = "idle"
    switch (props.cell.state) {
        case BingoEntryState.Pending:
            bClass = "pending"
            break;
        case BingoEntryState.Confirmed:
            bClass = "confirmed"
            break;
        case BingoEntryState.Missed:
            bClass = "missed"
            break;
        case BingoEntryState.Rejected:
            bClass = "rejected"
            break;
        default:
            break;
    }
    
    var showTimer: boolean = props.cell.timer != null;
    var duration = showTimer ? (props.cell.timer.getTime() - Date.now()) / 1000 : 0;

    const confirmKey = (key: number) => {
        setPrompting(false)
        props.onConfirm(key)
    }

    return (
        <div key={props.cell.key} ref={ref}
             className={clsx("bingoEntry", bClass, props.isSelected ? [isPrompting ? "prompting" : "highlighted", "prompt"] : '')}
             onClickCapture={(_) => isCurrentElementActive ? setPrompting(!isPrompting) : props.onSelect(props.cell.key) }
             style={{ position: 'relative' }}>
            <div className='key'>{props.cell.key}</div>
            <div className='text'>
               {props.cell.text}
            </div>
            <div
                className={clsx("bingoCellPrompt", (isCurrentElementActive && isPrompting) ? "bingoCellPromptVisible" : "bingoCellPromptHidden")}
                onClickCapture={ isPrompting ? (_) => confirmKey(props.cell.key) : null} >
                {LL.Mobile.ConfirmButton()}
            </div>
            <div className={clsx("bingoCellTimer", showTimer && duration > 0 ? "bingoCellTimerVisible" : "bingoCellTimerHidden")}>
                <div style={{ display: 'inline-block' }}>
                    {
                        showTimer && duration > 0 ? 
                        <CountdownCircleTimer
                            isPlaying
                            size={50}
                            strokeWidth={3}
                            colors="#000"
                            isLinearGradient={true}
                            duration={duration}
                            children={renderTime}
                        /> : null
                    }
                </div>
            </div>
        </div>
    )
})

export default BingoMobileEntry;