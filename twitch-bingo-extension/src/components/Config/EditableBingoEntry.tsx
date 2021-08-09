import * as React from 'react';
import Icon from '@material-ui/core/Icon'
import IconButton from '@material-ui/core/IconButton'
import PlaylistAdd from '@material-ui/icons/PlaylistAdd';
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import TextField from '@material-ui/core/TextField'
import Check from '@material-ui/icons/Check'
import Delete from '@material-ui/icons/Delete'
import { BingoEditableEntry } from '../../model/BingoEntry';
import { I18nContext } from '../../i18n/i18n-react';
import { Edit } from '@material-ui/icons';

type EditableBingoEntryProps = {
    item: BingoEditableEntry,
    selected: boolean,
    onDelete: ((entry: BingoEditableEntry) => void),
    onChange: ((entry: BingoEditableEntry) => void),
    onSelect: ((entry: BingoEditableEntry) => void),
}

export default function EditableBingoEntry(props: EditableBingoEntryProps) {
    const { LL } = React.useContext(I18nContext)
    
    const [isEditing, setEditing] = React.useState(props.item.isNew)
    const [value, setValue] = React.useState(props.item.text)
    const [editingValue, setEditingValue] = React.useState(props.item.isNew ? props.item.text : "")

    const editField = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        if (props.item.isNew){
            editField.current.focus()
        }
    }, [props.item])

    const edit = (): void => {
        setEditing(true)
        setEditingValue(value)
    }

    const endEdit = (): void => {
        if (editingValue === "")
        {
            return
        }
        setEditing(false)
        setValue(editingValue)

        props.onChange({
            key: props.item.key,
            isNew: false,
            text: editingValue,
        });
    }

    const deleteCallback = (): void => {
        if (props.onDelete)
        {
            props.onDelete(props.item);
        }
    }

    const onKeyDown = (e: React.KeyboardEvent<any>): void => {
        if (e.key === "Enter")
        {
            endEdit();
            e.stopPropagation();
        }
    }

    const onChange = (e: React.ChangeEvent<any>): void => {
        setEditingValue(e.target.value)
    }

    const onClick = (_e: React.MouseEvent<any>): void => {
        edit();
    }

    const deleteButton = (
        <IconButton
            onClick={deleteCallback}
            disabled={props.selected}
            title={props.selected ? LL.Config.EditableBingoEntry.DeleteLabelCantRemove() : LL.Config.EditableBingoEntry.DeleteLabel()}
            size="small">
            <Icon>
                <Delete />
            </Icon>
        </IconButton>
    )

    if (isEditing)
    {
        return (
            <ListItem>
                {deleteButton}
                <TextField
                    fullWidth={true}
                    ref={editField}
                    label={LL.Config.EditableBingoEntry.TextFieldLabel()}
                    placeholder={LL.Config.EditableBingoEntry.TextFieldPlaceholder()}
                    defaultValue={value}
                    onChange={onChange}
                    onKeyUp={onKeyDown}
                />
                <IconButton onClick={endEdit} size="small">
                    <Icon>
                        <Check />
                    </Icon>
                </IconButton>
            </ListItem>
        )
    }
    else
    {
        return (
            <ListItem button>
                {deleteButton}
                <ListItemText
                    primary={value}
                    onClick={() => props.onSelect(props.item)}
                    onDoubleClick={onClick}
                />
                {
                    props.selected ? null : 
                        <IconButton onClick={() =>
                            {
                                props.onSelect(props.item);
                                return false;
                            }
                        } size="small" title={LL.Config.EditableBingoEntry.AddSelectionLabel()} >
                            <Icon>
                                <PlaylistAdd />
                            </Icon>
                        </IconButton>
                }
                <IconButton onClick={onClick} size="small" title={LL.Config.EditableBingoEntry.EditLabel()} >
                    <Icon>
                        <Edit />
                    </Icon>
                </IconButton>
            </ListItem>
        )
    }
}