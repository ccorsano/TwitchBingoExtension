import React from 'react'
import clsx from 'clsx';
import makeStyles from "@material-ui/core/styles/makeStyles";
import { BingoEntry } from "../../EBS/BingoService/EBSBingoTypes"
import { bingoStyles } from '../../common/BingoStyles';
import { useRef } from 'react';

type BingoMobileEntryListProps = {
    entries: BingoEntry[],
    selectedKey?: number,
    onSelectKey: (key: number) => void,
}

const mobileEntryStyle = makeStyles({
    bingoEntry: {
        paddingTop: '5px',
        paddingBottom: '5px',
        paddingLeft: '5px',
        paddingRight: '5px',
        minHeight: '24px',
    },
    highlighted: {
        background: 'linear-gradient(45deg, rgba(255,255,255,0.8) 100%, rgba(200,200,200,0.8) 0%);'
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
            entriesRefs.current.get(props.selectedKey).scrollIntoView()
        }
    }, [props.selectedKey])

    return (
        <div ref={listRef}>
            {
                props.entries.map(entry => {
                    const isCurrentElementSelected = props.selectedKey == entry.key
                    const isCurrentElementPrompting = isCurrentElementSelected && isPrompting

                    return (
                        <div key={entry.key} ref={(ref) => { entriesRefs.current.set(entry.key, ref) }}
                             className={clsx(styles.bingoEntry, isCurrentElementSelected ? (isPrompting ? styles.highlighted : bStyles.prompt) : '')}
                             onClickCapture={(_) => !isCurrentElementPrompting ? props.onSelectKey(entry.key) : null }
                             onTouchEndCapture={ (_) => !isCurrentElementPrompting ? props.onSelectKey(entry.key): null }
                             onDoubleClickCapture={(_) => setPrompting(!isPrompting)} >
                            {isCurrentElementPrompting ? (<React.Fragment><span>{entry.text}</span><button title="Confirm">Confirm</button></React.Fragment>) : (<span>{entry.text}</span>)}
                        </div>
                    )
                })
            }
        </div>
    )
}