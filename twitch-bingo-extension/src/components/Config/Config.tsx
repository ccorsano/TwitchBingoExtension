import * as React from 'react';
import { Box, Button, Card, CardActions, CardContent, CardHeader, Grid, Icon, IconButton, List, Paper, Slider, Typography } from '@material-ui/core'
import EditableBingoEntry from './EditableBingoEntry';
import { AddCircleOutline } from '@material-ui/icons';
import { BingoEntry } from '../../model/BingoEntry';
import { TwitchExtensionConfiguration, TwitchExtHelper } from '../../common/TwitchExtension';

type ConfigState = {
    nextKey: number,
    entries: BingoEntry[],
    rows: number,
    columns: number,
}

export default class Config extends React.Component<any, ConfigState> {
    state: ConfigState = {
        nextKey: 0,
        entries: new Array(0),
        rows: 3,
        columns: 3,
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
            entries: configContent?.entries ?? new Array(0),
            rows: configContent?.rows ?? 3,
            columns: configContent?.columns ?? 3,
        });
    }

    onAdd = (): void => {
        var newEntry = new BingoEntry();
        newEntry.text = "";
        newEntry.isNew = true;
        newEntry.key = this.state.nextKey;
        this.setState({
            nextKey: this.state.nextKey + 1,
            entries: this.state.entries.concat([newEntry])
        });
    }

    onSave = (): void => {
        TwitchExtHelper.configuration.set('broadcaster', '0.0.1', JSON.stringify({
            nextKey: this.state.nextKey,
            entries: this.state.entries,
            rows: this.state.rows,
            columns: this.state.columns,
        }));
        TwitchExtHelper.send('broadcast','application/json', {
            type: "set-config",
            payload: {
                entries: this.state.entries,
                rows: this.state.rows,
                columns: this.state.columns,
            }
        });
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

    onRowsChange = (rows: number): void => {
        this.setState({
            rows: rows
        });
    }

    onColumnsChange = (columns: number): void => {
        this.setState({
            columns: columns
        });
    }

    render(){
        var rows = this.state.rows;
        var columns = this.state.columns;

        var jsxElement: JSX.Element = null;
        if (this.state.entries.length == 0)
        {
            jsxElement = <Typography><em>No items in Bingo, go add some !</em></Typography>
        }
        else
        {
            jsxElement = <List>
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
                </List>;
        }

        return [
            <Card>
                <CardHeader title="Configure Bingo" />
                <CardContent>
                    { jsxElement }
                </CardContent>
                <CardActions>
                    <IconButton onClick={this.onAdd}>
                        <Icon>
                            <AddCircleOutline />
                        </Icon>
                    </IconButton>
                </CardActions>
            </Card>,
            <Card>
                <CardHeader title="Configure Grid" />
                <CardContent>
                    <Typography>
                        Columns
                    </Typography>
                    <Slider
                        defaultValue={3}
                        step={1}
                        min={1}
                        marks
                        max={9}
                        valueLabelDisplay="auto"
                        value={columns}
                        onChange={(_, value) => this.onColumnsChange(value as number)}
                    />
                    <Typography>
                        Rows
                    </Typography>
                    <Slider
                        defaultValue={3}
                        step={1}
                        min={1}
                        marks
                        max={9}
                        valueLabelDisplay="auto"
                        value={rows}
                        onChange={(_, value) => this.onRowsChange(value as number)}
                    />
                    <Grid container xs={12}>
                    {
                        [...Array(rows).keys()].map(_ => {
                            return <Grid container item xs={12} spacing={1}>
                                {
                                    [...Array(columns).keys()].map(_ => {
                                        return <Grid item xs>
                                            <Paper className="paper" elevation={3}>
                                                <Box py={2} my={0.5}>
                                                    <Typography>
                                                        
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        </Grid>
                                    })
                                }
                            </Grid>
                        })
                    }
                    </Grid>
                </CardContent>
                <CardActions>
                    <Button variant="contained" color="primary" onClick={this.onSave}>
                        Save
                    </Button>
                </CardActions>
            </Card>
        ]
    }
}