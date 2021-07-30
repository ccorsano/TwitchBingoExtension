import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Icon from '@material-ui/core/Icon'
import IconButton from '@material-ui/core/IconButton'
import List from '@material-ui/core/List'
import Typography from '@material-ui/core/Typography'
import AddCircleOutline from '@material-ui/icons/AddCircleOutline'
import AssignmentReturned from '@material-ui/icons/AssignmentReturned'
import CloudUploadOutlined from '@material-ui/icons/CloudUploadOutlined'
import React from 'react'
import { useRef } from 'react'
import { BingoEntry } from '../../EBS/BingoService/EBSBingoTypes'
import { I18nContext } from '../../i18n/i18n-react'
import { BingoEditableEntry } from '../../model/BingoEntry'
import EditableBingoEntry from './EditableBingoEntry'

type LibraryEditorProps = {
    entries: BingoEditableEntry[],
    selectedEntries: number[],
    onAdd: () => void,
    onDeleteEntry: (key: number) => void,
    onChangeEntry: (key: number, changedEntry: BingoEditableEntry) => void,
    onAddToSelection: (selectedEntry: BingoEditableEntry) => void,
    onEntriesUpload: (evt: React.ChangeEvent<HTMLInputElement>) => void,
}

export default function LibraryEditor(props: LibraryEditorProps)
{
    const { LL } = React.useContext(I18nContext)
    
    const textInputRef = useRef<HTMLInputElement>(null)
    const textAreaRef = useRef<HTMLTextAreaElement>(null)

    const isSelected = (entry: BingoEntry): boolean => props.selectedEntries.some(b => b == entry.key);
    
    const onEntriesCopy = (_evt: React.MouseEvent<HTMLButtonElement>): void => {
        if (! navigator.clipboard){
            console.error("Copy to clipboard not supported on this browser");
            return;
        }
        const content = props.entries.map(e => e.text).join('\n');
        navigator.clipboard.writeText(content).then(() => {
            console.log("Text copied to clipboard")
        }, (error: string) => {
            console.error("Could not copy text to clipboard", error);
        });
    }
    
    var sourceListElement: JSX.Element = null;
    if (props.entries.length == 0)
    {
        sourceListElement = <Typography><em>No items in Bingo, go add some !</em></Typography>
    }
    else
    {
        sourceListElement = <List>
            {
                props.entries.map(value => {
                    return <EditableBingoEntry
                                key={value.key}
                                item={value}
                                selected={isSelected(value)}
                                onDelete={(_changedEntry) => props.onDeleteEntry(value.key)}
                                onChange={(changedEntry) => props.onChangeEntry(value.key, changedEntry)}
                                onSelect={(selectedEntry) => props.onAddToSelection(selectedEntry)}
                            />
                })
            }
            </List>;
    }

    return (
        <Card>
            <CardHeader title={LL.Config.LibraryEditor.Title()} subheader={LL.Config.LibraryEditor.TitleSubHeader()}/>
            <CardActions>
                <input
                    ref={textInputRef}
                    type="file"
                    style={{display: 'none'}}
                    onChange={props.onEntriesUpload} />
                <IconButton onClick={(_) => textInputRef.current.click()} aria-label={LL.Config.LibraryEditor.UploadButtonLabel()} title={LL.Config.LibraryEditor.UploadButtonTitle()}>
                    <Icon>
                        <CloudUploadOutlined />
                    </Icon> 
                </IconButton>
                <textarea ref={textAreaRef} style={{display: 'none'}}/>
                <IconButton onClick={onEntriesCopy} aria-label={LL.Config.LibraryEditor.CopyEntriesButtonLabel()} title={LL.Config.LibraryEditor.CopyEntriesButtonTitle()}>
                    <Icon>
                        <AssignmentReturned />
                    </Icon>
                </IconButton>
                <IconButton onClick={props.onAdd} aria-label={LL.Config.LibraryEditor.AddEntryButtonLabel()} title={LL.Config.LibraryEditor.AddEntryButtonTitle()}>
                    <Icon>
                        <AddCircleOutline />
                    </Icon>
                </IconButton>
            </CardActions>
            <CardContent>
                { sourceListElement }
            </CardContent>
        </Card>
    )
}