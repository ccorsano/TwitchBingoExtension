import React from 'react'
import clsx from 'clsx';
import makeStyles from "@material-ui/core/styles/makeStyles";
import { bingoStyles } from '../../common/BingoStyles';
import { useRef } from 'react';
import CheckRounded from '@material-ui/icons/CheckRounded';
import { BingoEntryState, BingoGridCell } from '../../model/BingoEntry';

type BingoMobileEntryListProps = {
    entries: BingoGridCell[],
    selectedKey?: number,
    onSelectKey: (key: number) => void,
    onTentative: (key: number) => void,
}

const mobileEntryStyle = makeStyles({
    bingoEntry: {
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        paddingTop: '5px',
        paddingBottom: '5px',
        paddingLeft: '5px',
        paddingRight: '5px',
        height: '36px',
        overflow: 'hidden',
        borderRadius: '0.25rem',
        '& > div': {
            alignSelf: 'center'
        },
        transition: 'all 0.5s',
        '& .timer': {
            height: '0px',
            width: '0px',
            opacity: '0',
            transition: 'all 0.5s'
        },
        '& .text': {
            textOverflow: 'ellipsis',
            gridColumnStart: 1,
            gridColumnEnd: 3,
        },
        '& .action': {
            height: '0px',
            width: '0px',
            opacity: '0',
            transition: 'all 0.5s',
        },
    },
    highlighted: {
        height: 'unset',
        minHeight: '36px',
        overflowY: 'unset',
        '& .timer': {
            height: 'unset',
            width: 'fit-content',
            opacity: 1,
            gridColumn: 1,
        },
        '& .text': {
            textOverflow: 'unset',
            gridColumn: 2,
        },
        '& .action': {
            height: 'unset',
            width: 'fit-content',
            opacity: 1,
            gridColumn: 3,
        },
    },
    prompting: {
        height: 'unset',
        minHeight: '64px',
        overflowY: 'unset',
        '& .text': {
            textAlign: 'center',
        },
        '& .confirm': {
            borderTopRightRadius: '0.25rem',
            borderBottomRightRadius: '0.25rem',
        },
        '& .cancel': {
            borderTopLeftRadius: '0.25rem',
            borderBottomLeftRadius: '0.25rem',  
        },
    }
});

export default function BingoMobileEntryList(props: BingoMobileEntryListProps)
{
    const styles = mobileEntryStyle()
    const bStyles = bingoStyles()

    const [isPrompting, setPrompting] = React.useState(false)

    const listRef = useRef<HTMLDivElement>(null)
    const entriesRefs = useRef<Map<number, (HTMLDivElement | null)>>(new Map<number, (HTMLDivElement)>())

    React.useEffect(() => {
        if (props.selectedKey && entriesRefs.current.has(props.selectedKey))
        {
            var entryElement = entriesRefs.current.get(props.selectedKey)
            if (typeof entryElement['scrollIntoViewIfNeeded'] === 'function')
            {
                (entryElement as any).scrollIntoViewIfNeeded()
            }
            else
            {
                entryElement.scrollIntoView()
            }
            setPrompting(false)
        }
    }, [props.selectedKey])

    const confirmKey = (key: number) => {
        setPrompting(false)
        props.onTentative(key)
    }

    return (
        <div ref={listRef}>
            {
                props.entries.map(cell => {
                    const isCurrentElementSelected = props.selectedKey == cell.key
                    const isCurrentElementActive = isCurrentElementSelected && cell.state === BingoEntryState.Idle
                    
                    var bClass = bStyles.idle
                    switch (cell.state) {
                        case BingoEntryState.Pending:
                            bClass = bStyles.pending
                            break;
                        case BingoEntryState.Confirmed:
                            bClass = bStyles.confirmed
                            break;
                        case BingoEntryState.Missed:
                            bClass = bStyles.missed
                            break;
                        case BingoEntryState.Rejected:
                            bClass = bStyles.rejected
                            break;
                        default:
                            break;
                    }

                    return (
                        <div key={cell.key} ref={(ref) => { entriesRefs.current.set(cell.key, ref) } }
                             className={clsx(styles.bingoEntry, bClass, isCurrentElementSelected ? [isPrompting ? styles.prompting : styles.highlighted, bStyles.prompt] : '')}
                             onClickCapture={(_) => isCurrentElementActive ? setPrompting(true) : props.onSelectKey(cell.key) }
                             onTouchEndCapture={(_) => isCurrentElementActive ? setPrompting(true) : props.onSelectKey(cell.key) }>
                             <div className={clsx('timer')}>
                                &nbsp;
                             </div>
                             <div className={clsx('text')}>
                                 {
                                     (isCurrentElementActive && isPrompting) ? (
                                        <div style={{display:'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 24px'}}>
                                            <div style={{gridRow:1, gridColumnStart:1, gridColumnEnd: 3}}>{cell.text}</div>
                                            <div
                                                style={{gridRow:2, gridColumn:1, textAlign: 'center'}}
                                                className={clsx(bStyles.cancel, 'cancel')}
                                                onClickCapture={(_) => setPrompting(false)}>
                                                    Cancel
                                            </div>
                                            <div
                                                style={{gridRow:2, gridColumn:2, textAlign: 'center'}}
                                                className={clsx(bStyles.confirm, 'confirm')}
                                                onClickCapture={(_) => confirmKey(cell.key)}>
                                                    Confirm
                                            </div>
                                        </div>
                                     )
                                     :(
                                        <span>{cell.text}</span>
                                     )
                                 }
                             </div>
                             <div className={clsx('action')} onClickCapture={() => setPrompting(true)}>
                                {isCurrentElementActive ? (
                                    <CheckRounded />
                                ) : '' }
                             </div>
                        </div>
                    )
                })
            }
        </div>
    )
}