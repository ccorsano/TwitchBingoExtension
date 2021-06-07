import { Box, Grid, Paper, Typography } from '@material-ui/core';
import * as React from 'react';
import { TwitchExtHelper } from './TwitchExtension';
import { BingoEntry } from '../model/BingoEntry';
import BingoViewerEntry from './BingoViewerEntry';
import { BingoEBS } from '../EBS/BingoService/EBSBingoService';
import { Twitch } from '../services/TwitchService';

export type ViewerBingoComponentBaseState = {
    entries: BingoEntry[],
    rows: number,
    columns: number,
    canModerate: boolean,
    canVote: boolean,
    gameId?: string,
}

export type ViewerBingoComponentBaseProps = {
}

export default class ViewerBingoComponentBase<PropType extends ViewerBingoComponentBaseProps, StateType extends ViewerBingoComponentBaseState> extends React.Component<PropType & ViewerBingoComponentBaseProps, StateType & ViewerBingoComponentBaseState> {
    state: any = {
        entries: new Array(0),
        rows: 0,
        columns: 0,
        canModerate: false,
        canVote: false,
    };

    constructor(props: PropType){
        super(props)
    }

    componentDidMount() {
        Twitch.onConfiguration.push(this.loadConfig);
        TwitchExtHelper.listen('broadcast', (_target, _contentType, messageStr) => {
            let message = JSON.parse(messageStr);
            switch (message.type) {
                case 'set-config':
                    this.setState({
                        entries: message.payload.entries,
                        rows: message.payload.rows,
                        columns: message.payload.columns,
                    });
                    break;
                case 'start':
                    console.log("Received start for game:" + message.payload.gameId);
                    this.setState({
                        gameId: message.payload.gameId,
                    });
                    break;
                default:
                    break;
            }
        });
        Twitch.onAuthorized.push(_context => {
            this.setState({
                canModerate: TwitchExtHelper.viewer.role == 'broadcaster' || TwitchExtHelper.viewer.role == 'moderator',
                canVote: TwitchExtHelper.viewer.role != 'external',
            });
        });
    };

    loadConfig = (broadcasterConfig: any) => {
        console.log((window as any).Twitch.ext.configuration.broadcaster);
        console.log(TwitchExtHelper.configuration.broadcaster);
        var extensionConfig = Twitch.configuration;
        console.log(broadcasterConfig);
        console.log(extensionConfig);
        if (! extensionConfig)
        {
            return;
        }
        var configContent = JSON.parse(extensionConfig.content);
        this.setState({
            entries: configContent?.entries ?? new Array(0),
            rows: configContent?.rows ?? 3,
            columns: configContent?.columns ?? 3,
            gameId: configContent?.activeGame?.GameId
        });
    };

    getEntry = (row: number, col: number) => {
        var index = col + row * this.state.columns;
        if (this.state.entries.length > index)
        {
            return this.state.entries[index];
        }
        return {
            key: -(col + (row * this.state.columns)) - 1,
            text: "",
            isNew: false,
        };
    };

    onTentative = (entry: BingoEntry) => {  
        BingoEBS.tentative(this.state.gameId, entry.key.toString());
    };

    onConfirm = (entry: BingoEntry) => {
        BingoEBS.confirm(this.state.gameId, entry.key.toString());
    };

    render(){
        return [
            <Paper>
                <Typography>{this.state.canModerate ? "Moderator" : (this.state.canVote ? "Player" : "Lurker")}</Typography>
            </Paper>,
            <Box my={12} mx={2}>
            <Grid container>
            {
                [...Array(this.state.rows).keys()].map(row => {
                    return <Grid container item xs={12} spacing={1} key={row}>
                        {
                            [...Array(this.state.columns).keys()].map(col => {
                                let entry = this.getEntry(row, col);
                                if (! entry)
                                {
                                    return <Grid item xs key={this.state.nextKey + col + (row * this.state.columns)}>
                                        <BingoViewerEntry
                                            config={new BingoEntry()}
                                            canInteract={false}
                                            canConfirm={false}
                                            onTentative={this.onTentative}
                                            onConfirm={this.onConfirm}
                                        />
                                    </Grid>
                                }
                                else
                                {
                                    return <Grid item xs key={entry.key}>
                                        <BingoViewerEntry
                                            config={entry}
                                            canInteract={this.state.canVote}
                                            canConfirm={this.state.canModerate}
                                            onTentative={this.onTentative}
                                            onConfirm={this.onConfirm}
                                        />
                                    </Grid>
                                }
                            })
                        }
                    </Grid>
                })
            }
            </Grid>
            </Box>
        ]
    }
}