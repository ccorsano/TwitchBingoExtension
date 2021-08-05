import React from 'react'
import clsx from 'clsx';
import { useRef } from 'react';
import { BingoEntryState, BingoGridCell } from '../../model/BingoEntry';
import { I18nContext } from '../../i18n/i18n-react';
require('./BingoMobileEntryList.scss');

type BingoMobileEntryListProps = {
    entries: BingoGridCell[],
    selectedKey?: number,
    onSelectKey: (key: number) => void,
    onTentative: (key: number) => void,
}

export default function BingoMobileEntryList(props: BingoMobileEntryListProps)
{
    const { LL } = React.useContext(I18nContext)
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
                    
                    var bClass = "idle"
                    switch (cell.state) {
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

                    return (
                        <div key={cell.key} ref={(ref) => { entriesRefs.current.set(cell.key, ref) } }
                             className={clsx("bingoEntry", bClass, isCurrentElementSelected ? [isPrompting ? "prompting" : "highlighted", "prompt"] : '')}
                             onClickCapture={(_) => isCurrentElementActive ? setPrompting(!isPrompting) : props.onSelectKey(cell.key) }
                             onTouchEndCapture={(_) => isCurrentElementActive ? setPrompting(!isPrompting) : props.onSelectKey(cell.key) }
                             style={{ position: 'relative' }}>
                             <div>
                                     {cell.text}
                             </div>
                             <div
                                 className={clsx("bingoCellPrompt", isCurrentElementActive && isPrompting ? "bingoCellPromptVisible" : "bingoCellPromptHidden")}
                                 onClickCapture={ isPrompting ? (_) => confirmKey(cell.key) : null}
                                 onTouchEndCapture={ isPrompting ? (_) => confirmKey(cell.key) : null } >
                                 {LL.Mobile.ConfirmButton()}
                             </div>
                        </div>
                    )
                })
            }
        </div>
    )
}