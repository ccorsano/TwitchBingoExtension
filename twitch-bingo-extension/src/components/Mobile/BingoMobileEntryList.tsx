import React from 'react'
import { useRef } from 'react';
import { BingoGridCell } from '../../model/BingoEntry';
import BingoMobileEntry from './BingoMobileEntry';
require('./BingoMobileEntryList.scss');

type BingoMobileEntryListProps = {
    entries: BingoGridCell[],
    selectedKey?: number,
    onSelectKey: (key: number) => void,
    onTentative: (key: number) => void,
}

export default function BingoMobileEntryList(props: BingoMobileEntryListProps)
{
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
        }
    }, [props.selectedKey])

    return (
        <div ref={listRef}>
            {
                props.entries.map(cell => {
                    const isCurrentElementSelected = props.selectedKey == cell.key
                    
                    return (
                        <BingoMobileEntry
                            key={cell.key}
                            ref={(ref) => { entriesRefs.current.set(cell.key, ref) } }
                            cell={cell}
                            isSelected={isCurrentElementSelected}
                            onSelect={props.onSelectKey}
                            onConfirm={props.onTentative} />
                    )
                })
            }
        </div>
    )
}