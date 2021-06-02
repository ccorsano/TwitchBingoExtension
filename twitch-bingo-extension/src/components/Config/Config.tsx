import * as React from 'react';
import { Button, Card, CardActions, CardContent, CardHeader, Icon, IconButton, List } from '@material-ui/core'
import EditableBingoEntry from './EditableBingoEntry';
import { AddCircleOutline } from '@material-ui/icons';
import { BingoEntry } from '../../model/BingoEntry';
import { TwitchExtensionConfiguration, TwitchExtHelper } from '../../common/TwitchExtension';

type ConfigState = {
    nextKey: number,
    entries: BingoEntry[]
}

export default class Config extends React.Component<any, ConfigState> {
    state: ConfigState = {
        nextKey: 0,
        entries: new Array(0)
    }

    constructor(props: any){
        super(props)
        this.onSave = this.onSave.bind(this);
    }

    componentDidMount = () => {
        TwitchExtHelper.configuration.onChanged(this.loadConfig);
    }

    loadConfig = (broadcasterConfig: TwitchExtensionConfiguration) => {
        var extensionConfig = TwitchExtHelper.configuration.broadcaster;
        console.log(broadcasterConfig);
        console.log(extensionConfig);
        if (! extensionConfig)
        {
            return;
        }
        var configContent = JSON.parse(extensionConfig.content);
        this.setState({
            nextKey: configContent?.nextKey ?? 0,
            entries: configContent?.entries ?? new Array(0)
        });
    }

    onAdd = (): void => {
        console.log("Key: " + this.state.nextKey);
        var newEntry = new BingoEntry();
        newEntry.text = "";
        newEntry.isNew = true;
        newEntry.key = this.state.nextKey;
        this.setState({
            nextKey: this.state.nextKey + 1,
            entries: this.state.entries.concat([newEntry])
        });
        console.log("NextKey: " + this.state.nextKey);
    }

    onSave = (): void => {
        console.log("Saving NextKey: " + this.state.nextKey);
        console.log("Saving entries: " + JSON.stringify(this.state.entries));
        TwitchExtHelper.configuration.set('broadcaster', '0.0.1', JSON.stringify({
            nextKey: this.state.nextKey,
            entries: this.state.entries,
        }));
    }

    onChangeEntry = (key: number, entry: BingoEntry): void => {
        console.log("Changed Key: " + key);
        var index = this.state.entries.findIndex((entry) => { return entry.key == key; });
        if (index == -1){
            console.error("Could not find changed key " + key);
            return;
        }
        this.state.entries[index] = entry;
        this.setState({
            entries: this.state.entries
        });
    }

    onDeleteEntry = (key: number): void => {
        console.log("Deleting key: " + key);
        var index = this.state.entries.findIndex((entry) => { return entry.key == key; });
        if (index == -1){
            console.error("Could not find key " + key + " to delete");
            return;
        }
        console.log("Deleting index: " + index);
        this.state.entries.splice(index, 1);
        this.setState({
            entries: this.state.entries
        });
    }

    render(){
        return (
            <Card>
                <CardHeader title="Configure Bingo" />
                <CardContent>
                    <List>
                        {
                            this.state.entries.map(value => {
                                return <EditableBingoEntry
                                            key={value.key}
                                            item={value}
                                            onDelete={(_changedEntry) => this.onDeleteEntry(value.key)}
                                            onChange={(changedEntry) => this.onChangeEntry(value.key, changedEntry)}
                                        />
                            })
                        }
                    </List>
                </CardContent>
                <CardActions>
                    <IconButton onClick={this.onAdd}>
                        <Icon>
                            <AddCircleOutline />
                        </Icon>
                    </IconButton>
                    <Button variant="contained" color="primary" onClick={this.onSave}>
                        Save
                    </Button>
                </CardActions>
            </Card>
        )
    }
}