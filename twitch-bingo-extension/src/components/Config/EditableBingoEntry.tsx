import * as React from 'react';
import { Icon, IconButton, ListItem, ListItemText, TextField } from '@material-ui/core'
import { AddCircleOutline, Check, Delete } from '@material-ui/icons'
import { BingoEditableEntry } from '../../model/BingoEntry';

type EditableBingoEntryState = {
    isEditing: boolean,
    editingValue: string,
    value: string,
}

type EditableBingoEntryProps = {
    item: BingoEditableEntry,
    selected: boolean,
    onDelete: ((entry: BingoEditableEntry) => void),
    onChange: ((entry: BingoEditableEntry) => void),
    onSelect: ((entry: BingoEditableEntry) => void),
}

export default class EditableBingoEntry extends React.Component<EditableBingoEntryProps, EditableBingoEntryState> {
    state: EditableBingoEntryState = {
        isEditing: false,
        value: "",
        editingValue: "",
    }
    editField: HTMLDivElement;

    constructor(props: EditableBingoEntryProps){
        super(props)

        this.state.isEditing = props.item.isNew;
        this.state.value = props.item.text;
        if (props.item.isNew)
        {
            this.state.editingValue = props.item.text;
        }
    }

    componentDidMount() {
        if (this.props.item.isNew){
            this.editField.focus();
        }
    }

    edit = (): void => {
        this.setState({
            isEditing: true,
            editingValue: this.state.value,
        });
    }

    endEdit = (): void => {
        this.setState({
            isEditing: false,
            value: this.state.editingValue,
        });
        this.props.onChange({
            key: this.props.item.key,
            isNew: false,
            text: this.state.editingValue,
        });
    }

    delete = (): void => {
        if (this.props.onDelete)
        {
            this.props.onDelete(this.props.item);
        }
    }

    onKeyDown = (e: React.KeyboardEvent<any>): void => {
        if (e.key === "Enter")
        {
            this.endEdit();
        }
    }

    onChange = (e: React.ChangeEvent<any>): void => {
        this.setState({
            editingValue: e.target.value
        });
    }

    onClick = (_e: React.MouseEvent<any>): void => {
        this.edit();
    }

    render(){
        if (this.state.isEditing)
        {
            return (
                <ListItem>
                    <IconButton onClick={this.delete}>
                        <Icon>
                            <Delete />
                        </Icon>
                    </IconButton>
                    <TextField
                        fullWidth={true}
                        ref={(input) => { this.editField = input; }} 
                        label="Bingo proposition"
                        placeholder="Proposition"
                        defaultValue={this.state.value}
                        onChange={this.onChange}
                        onKeyUp={this.onKeyDown}
                    />
                    <IconButton onClick={this.endEdit}>
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
                        primary={this.state.value}
                        onClick={() => this.props.onSelect(this.props.item)}
                        onDoubleClick={this.onClick}
                    />
                    {
                        this.props.selected ? null : 
                            <IconButton onClick={() => {
                                    this.props.onSelect(this.props.item);
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
}