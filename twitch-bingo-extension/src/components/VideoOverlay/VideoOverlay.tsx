import { Box, Grid, Paper, Typography } from '@material-ui/core';
import * as React from 'react';
import { TwitchExtensionConfiguration, TwitchExtHelper } from '../../common/TwitchExtension';
import { BingoEntry } from '../../model/BingoEntry';

type VideoOverlayState = {
    entries: BingoEntry[],
    rows: number,
    columns: number,
}

export default class Mobile extends React.Component<any, VideoOverlayState> {
    state: VideoOverlayState = {
        entries: new Array(0),
        rows: 0,
        columns: 0,
    }

    constructor(props: any){
        super(props)
    }

    componentDidMount = () => {
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
            entries: configContent?.entries ?? new Array(0),
            rows: configContent?.rows ?? 3,
            columns: configContent?.columns ?? 3,
        });
    }

    getEntry = (row: number, col: number) => {
        var index = col + row * this.state.columns;
        if (this.state.entries.length > index)
        {
            return this.state.entries[index].text;
        }
        return "Missing";
    }

    render(){
        return (
            <Box my={12} mx={2}>
            <Grid container>
            {
                [...Array(this.state.rows).keys()].map(row => {
                    return <Grid container item xs={12} spacing={1}>
                        {
                            [...Array(this.state.columns).keys()].map(col => {
                                return <Grid item xs>
                                    <Paper className="paper" elevation={3}>
                                        <Box py={3} my={0.5}>
                                            <Typography>
                                                {this.getEntry(row, col)}
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
            </Box>
        )
    }
}