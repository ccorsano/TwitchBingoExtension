import * as React from 'react';
import Icon from '@material-ui/core/Icon'
import IconButton from '@material-ui/core/IconButton'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import TextField from '@material-ui/core/TextField'
import AddCircleOutline from '@material-ui/icons/AddCircleOutline'
import Check from '@material-ui/icons/Check'
import Delete from '@material-ui/icons/Delete'
import { BingoEditableEntry } from '../../model/BingoEntry';
import { I18nContext } from '../../i18n/i18n-react';

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
        }
    }

    const onChange = (e: React.ChangeEvent<any>): void => {
        setEditingValue(e.target.value)
    }

    const onClick = (_e: React.MouseEvent<any>): void => {
        edit();
    }

    if (isEditing)
    {
        return (
            <ListItem>
                <IconButton onClick={deleteCallback}>
                    <Icon>
                        <Delete />
                    </Icon>
                </IconButton>
                <TextField
                    fullWidth={true}
                    ref={editField}
                    label={LL.Config.EditableBingoEntry.TextFieldLabel()}
                    placeholder={LL.Config.EditableBingoEntry.TextFieldPlaceholder()}
                    defaultValue={value}
                    onChange={onChange}
                    onKeyUp={onKeyDown}
                />
                <IconButton onClick={endEdit}>
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
                <ListItemText
                    primary={value}
                    onClick={() => props.onSelect(props.item)}
                    onDoubleClick={onClick}
                />
                {
                    props.selected ? null : 
                        <IconButton onClick={() => {
                                props.onSelect(props.item);
                                return false;
                            }
                        }>
                            <Icon>
                                <AddCircleOutline />
                            </Icon>
                        </IconButton>
                }
            </ListItem>
        )
    }
}