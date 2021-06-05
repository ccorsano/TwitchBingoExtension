import { Box, Grid, Paper, Typography } from '@material-ui/core';
import * as React from 'react';
import { TwitchExtensionConfiguration, TwitchExtHelper } from './TwitchExtension';
import { BingoEntry } from '../model/BingoEntry';
import BingoViewerEntryF from './BingoViewerEntry';

export type ViewerBingoComponentBaseState = {
    entries: BingoEntry[],
    rows: number,
    columns: number,
    canModerate: boolean,
    canVote: boolean,
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
        TwitchExtHelper.configuration.onChanged(this.loadConfig);
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
            
                default:
                    break;
            }
        });
        TwitchExtHelper.onAuthorized(_context => {
            this.setState({
                canModerate: TwitchExtHelper.viewer.role == 'broadcaster' || TwitchExtHelper.viewer.role == 'moderator',
                canVote: TwitchExtHelper.viewer.role != 'external',
            });
        });
    };

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
            entries: configContent?.entries ?? new Array(0),
            rows: configContent?.rows ?? 3,
            columns: configContent?.columns ?? 3,
        });
    };

    getEntry = (row: number, col: number) => {
        var index = col + row * this.state.columns;
        if (this.state.entries.length > index)
        {
            return this.state.entries[index];
        }
        return null;
    };

    onTentative = (_entry: BingoEntry) => {  
    };

    onConfirm = (_entry: BingoEntry) => {
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
                                    return null;
                                }
                                else
                                {
                                    return <Grid item xs key={entry.key}>
                                        <BingoViewerEntryF
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