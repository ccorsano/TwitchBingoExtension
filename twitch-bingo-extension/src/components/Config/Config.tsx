import * as React from 'react';
import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Grid from '@material-ui/core/Grid'
import Icon from '@material-ui/core/Icon'
import IconButton from '@material-ui/core/IconButton'
import List from '@material-ui/core/List'
import ListItem from '@material-ui/core/ListItem'
import ListItemText from '@material-ui/core/ListItemText'
import Paper from '@material-ui/core/Paper'
import Slider from '@material-ui/core/Slider'
import Typography from '@material-ui/core/Typography'
import EditableBingoEntry from './EditableBingoEntry';
import AddCircleOutline from '@material-ui/icons/AddCircleOutline';
import AssignmentReturned from '@material-ui/icons/AssignmentReturned';
import CloudUploadOutlined from '@material-ui/icons/CloudUploadOutlined';
import RemoveCircleOutline from '@material-ui/icons/RemoveCircleOutline';
import { TwitchExtensionConfiguration, TwitchExtHelper } from '../../common/TwitchExtension';
import { BingoEBS } from '../../EBS/BingoService/EBSBingoService';
import * as EBSBingo from '../../EBS/BingoService/EBSBingoTypes';
import { Twitch } from '../../services/TwitchService';
import { BingoEntry } from '../../EBS/BingoService/EBSBingoTypes';
import { BingoEditableEntry } from '../../model/BingoEntry';
import { EBSVersion } from '../../EBS/EBSConfig';

type ConfigState = {
    nextKey: number,
    entries: BingoEditableEntry[],
    selectedEntries: number[],
    rows: number,
    columns: number,
    fileDownloadUrl: string,
    activeGame?: EBSBingo.BingoGame,
}

export default class Config extends React.Component<any, ConfigState> {
    state: ConfigState = {
        nextKey: 0,
        entries: new Array(0),
        selectedEntries: new Array(0),
        rows: 3,
        columns: 3,
        fileDownloadUrl: null,
    }

    constructor(props: any){
        super(props)
        this.onSave = this.onSave.bind(this);
    }

    textInput: HTMLInputElement = null;
    setTextInputRef = (element: HTMLInputElement) => {
        this.textInput = element;
    };
    textArea: HTMLTextAreaElement = null;
    setTextAreaRef = (element: HTMLTextAreaElement) => {
        this.textArea = element;
    };
    downloadFileRef: HTMLAnchorElement = null;
    setDownloadFileRef = (element: HTMLAnchorElement) => {
        this.downloadFileRef = element;
    };

    componentDidMount = () => {
        Twitch.onConfiguration.push(this.loadConfig);
    }

    loadConfig = (broadcasterConfig: TwitchExtensionConfiguration) => {
        if (! broadcasterConfig)
        {
            return;
        }
        TwitchExtHelper.rig.log(broadcasterConfig.content);
        var configContent = JSON.parse(broadcasterConfig.content);
        this.setState({
            nextKey: configContent?.nextKey ?? 0,
            entries: configContent?.entries ?? new Array(0),
            selectedEntries: configContent?.selectedEntries ?? new Array(0),
            rows: configContent?.rows ?? 3,
            columns: configContent?.columns ?? 3,
            activeGame: configContent?.activeGame,
        });
    }

    onAdd = (): void => {
        var newEntry = new BingoEditableEntry();
        newEntry.text = "";
        newEntry.isNew = true;
        newEntry.key = this.state.nextKey;
        this.setState({
            nextKey: this.state.nextKey + 1,
            entries: this.state.entries.concat([newEntry])
        });
    }

    onSave = (): void => {
        const serializedConfig = JSON.stringify({
            nextKey: this.state.nextKey,
            entries: this.state.entries,
            selectedEntries: this.state.selectedEntries,
            rows: this.state.rows,
            columns: this.state.columns,
            activeGame: this.state.activeGame,
        });
        TwitchExtHelper.configuration.set('broadcaster', EBSVersion, serializedConfig);
        TwitchExtHelper.rig.log(serializedConfig);
        TwitchExtHelper.send('broadcast','application/json', {
            type: "set-config",
            payload: {
                entries: this.state.entries,
                selectedEntries: this.state.selectedEntries,
                rows: this.state.rows,
                columns: this.state.columns,
            }
        });
    }

    onAddToSelection = (entry: BingoEntry): void => {
        if (! this.isSelected(entry))
        {
            this.setState({
                selectedEntries: this.state.selectedEntries.concat(entry.key)
            });
        }
    }

    onRemoveFromSelection = (entry: BingoEntry): void => {
        if (entry && this.isSelected(entry))
        {
            var index = this.state.selectedEntries.indexOf(entry.key);
            this.state.selectedEntries.splice(index, 1);
            this.forceUpdate();
        }
    }

    onStart = (): void => {
        BingoEBS.createGame({
            rows: this.state.rows,
            columns: this.state.columns,
            entries: this.state.selectedEntries.map<EBSBingo.BingoEntry>((entryKey: number) => {
                var entry:BingoEntry = this.state.entries.find(b => b.key == entryKey);
                if (! entry)
                {
                    throw "Missing entry with key " + entryKey;
                }
                return {
                    key: entry.key,
                    text: entry.text,
                };
            })
        }).then((game)=> {
            console.log("Started game " + game.gameId);

            this.setState({
                activeGame: game,
            });
            
            var configUpdateJson = JSON.stringify({
                nextKey: this.state.nextKey,
                entries: this.state.entries,
                selectedEntries: this.state.selectedEntries,
                rows: this.state.rows,
                columns: this.state.columns,
                activeGame: game,
            })
            TwitchExtHelper.configuration.set('broadcaster', EBSVersion, configUpdateJson);
            console.log(configUpdateJson);
            TwitchExtHelper.send('broadcast','application/json', {
                type: "start",
                payload: game
            });
        });
    }

    onStop = (): void => {
        if (! this.state.activeGame)
        {
            return;
        }
        BingoEBS.stopGame(this.state.activeGame.gameId).finally(() => {
            TwitchExtHelper.send('broadcast','application/json', {
                type: "stop",
                payload: this.state.activeGame
            })
            this.setState({
                activeGame: null
            })
        })
    }

    onChangeEntry = (key: number, entry: BingoEditableEntry): void => {
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
        var index = this.state.entries.findIndex((entry) => { return entry.key == key; });
        if (index == -1){
            console.error("Could not find key " + key + " to delete");
            return;
        }
        this.state.entries.splice(index, 1);
        this.setState({
            entries: this.state.entries,
            selectedEntries: this.state.selectedEntries.filter(s => s != key),
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

    onEntriesUpload = (evt: React.ChangeEvent<HTMLInputElement>): void => {
        var file = evt.target.files[0];
        var reader = new FileReader();
        reader.onload = (ev: ProgressEvent<FileReader>) => {
            var content = ev.target.result as string;

            var entries:BingoEditableEntry[] = new Array(0);
            var nextKey = this.state.nextKey;

            content.split('\n').forEach(line => {
                if(! line) return;

                var newEntry = new BingoEditableEntry();
                newEntry.text = line;
                newEntry.isNew = false;
                newEntry.key = nextKey++;
                console.log("Entry: " + newEntry.key + " - " + newEntry.text)
                entries.push(newEntry);
            });
            this.setState({
                nextKey: nextKey,
                entries: entries,
                selectedEntries: new Array(0),
            });
        };
        reader.readAsText(file);
    }

    onEntriesCopy = (_evt: React.MouseEvent<HTMLButtonElement>): void => {
        if (! navigator.clipboard){
            console.error("Copy to clipboard not supported on this browser");
            return;
        }
        const content = this.state.entries.map(e => e.text).join('\n');
        navigator.clipboard.writeText(content).then(() => {
            console.log("Text copied to clipboard")
        }, (error: string) => {
            console.error("Could not copy text to clipboard", error);
        });
    }

    isSelected = (entry: BingoEntry): boolean => this.state.selectedEntries.some(b => b == entry.key);

    canStart = (): boolean => this.state.selectedEntries.length >= this.state.rows * this.state.columns;

    render(){
        var rows = this.state.rows;
        var columns = this.state.columns;

        var sourceListElement: JSX.Element = null;
        var targetListElement: JSX.Element = null;
        if (this.state.entries.length == 0)
        {
            sourceListElement = <Typography><em>No items in Bingo, go add some !</em></Typography>
        }
        else
        {
            sourceListElement = <List>
                {
                    this.state.entries.map(value => {
                        return <EditableBingoEntry
                                    key={value.key}
                                    item={value}
                                    selected={this.isSelected(value)}
                                    onDelete={(_changedEntry) => this.onDeleteEntry(value.key)}
                                    onChange={(changedEntry) => this.onChangeEntry(value.key, changedEntry)}
                                    onSelect={(changedEntry) => this.onAddToSelection(changedEntry)}
                                />
                    })
                }
                </List>;
        }
        if (this.state.selectedEntries.length == 0)
        {
            targetListElement = <Typography><em>No items selected</em></Typography>
        }
        else
        {
            targetListElement = <List>
                {
                    this.state.selectedEntries.map(key => {
                        var entry:BingoEntry = this.state.entries.find(b => b.key == key);
                        return <ListItem button onClick={() => this.onRemoveFromSelection(entry)}>
                            <ListItemText
                                primary={entry.text}
                            />
                            <IconButton onClick={() => this.onRemoveFromSelection(entry)}>
                                <Icon>
                                    <RemoveCircleOutline />
                                </Icon>
                            </IconButton>
                        </ListItem>
                    })
                }
            </List>;
        }

        return [
            <Card>
                <CardHeader title="Status" />
                <CardContent>
                    {
                        this.state.activeGame != null ?
                        <Typography>Active</Typography> :
                        <Typography>Inactive</Typography>
                    }
                </CardContent>
                <CardActions>
                    {
                        this.state.activeGame ? <Button variant="contained" color="secondary" onClick={this.onStop}>Stop game</Button> : null
                    }
                </CardActions>
            </Card>,
            <React.Fragment>
            {
                this.state.activeGame != null ? null :
                [
                    <Card>
                        <CardHeader title="Library" subheader="Load or add all your bingo entries here."/>
                        <CardActions>
                            <input
                                ref={this.setTextInputRef}
                                type="file"
                                style={{display: 'none'}}
                                onChange={this.onEntriesUpload} />
                            <IconButton onClick={(_) => this.textInput.click()} aria-label="Upload entry list" title="Replace entries by uploading a .txt file">
                                <Icon>
                                    <CloudUploadOutlined />
                                </Icon> 
                            </IconButton>
                            <textarea ref={this.setTextAreaRef} style={{display: 'none'}}/>
                            <IconButton onClick={this.onEntriesCopy} aria-label="Copy current entries to your pasteboard" title="Copy current entries to your pasteboard">
                                <Icon>
                                    <AssignmentReturned />
                                </Icon>
                            </IconButton>
                            <IconButton onClick={this.onAdd} aria-label="Add a new entry to the list" title="Add a new entry to the list">
                                <Icon>
                                    <AddCircleOutline />
                                </Icon>
                            </IconButton>
                        </CardActions>
                        <CardContent>
                            { sourceListElement }
                        </CardContent>
                    </Card>,
                    <Card>
                        <CardHeader title="Selection" subheader="These are the bingo entries currently selected for the next game."/>
                        <CardContent>
                            { targetListElement }
                        </CardContent>
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
                                [...Array(rows).keys()].map(r => {
                                    return <Grid container item xs={12} spacing={1}>
                                        {
                                            [...Array(columns).keys()].map(c => {
                                                return <Grid item xs>
                                                    <Paper className="paper" elevation={3}>
                                                        <Box py={2} my={0.5} bgcolor={ (r * columns + c) < this.state.selectedEntries.length ? "primary.main" : "text.disabled" }>
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
                            <Button variant="contained" color="primary" onClick={this.onStart} disabled={!this.canStart()}>
                                Start
                            </Button>
                        </CardActions>
                    </Card>
                ]
            }
            </React.Fragment>
        ]
    }
}