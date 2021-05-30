import * as React from 'react';
import { Icon, IconButton, ListItem, ListItemText, TextField } from '@material-ui/core'
import { Check, Edit } from '@material-ui/icons'

type EditableBingoEntryState = {
    isEditing: boolean,
    editingValue: string,
    value: string,
}

type EditableBingoEntryProps = {
    isNew: boolean,
    value: string,
}

export default class EditableBingoEntry extends React.Component<EditableBingoEntryProps, EditableBingoEntryState> {
    state: EditableBingoEntryState = {
        isEditing: false,
        value: "",
        editingValue: "",
    }

    constructor(props: EditableBingoEntryProps){
        super(props)

        this.state.isEditing = props.isNew;
        this.state.value = props.value;
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

    onDoubleClick = (_e: React.MouseEvent<any>): void => {
        this.edit();
    }

    render(){
        if (this.state.isEditing)
        {
            return (
                <ListItem>
                    <TextField
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
                <ListItem>
                    <ListItemText primary={this.state.value} onDoubleClick={this.onDoubleClick} />
                    <IconButton onClick={this.edit}>
                            <Icon>
                                <Edit />
                            </Icon>
                    </IconButton>
                </ListItem>
            )
        }

    }
}