import { Grid, Paper, Typography } from '@material-ui/core';
import React from 'react';
import ViewerBingoComponentBase from '../../common/ViewerBingoComponentBase';
import { ViewerBingoComponentBaseState, ViewerBingoComponentBaseProps } from '../../common/ViewerBingoComponentBase';

interface VideoOverlayState extends ViewerBingoComponentBaseState {
    isCollapsed: boolean;
}

interface VideoOverlayProps extends ViewerBingoComponentBaseProps {

}

export default class VideoOverlay extends ViewerBingoComponentBase<VideoOverlayProps, VideoOverlayState> {
    state: VideoOverlayState = {
        isCollapsed: true,
        entries: new Array(0),
        rows: 0,
        columns: 0,
        canModerate: false,
        canVote: false,
        isStarted: false,
    }

    constructor(props: VideoOverlayProps){
        super(props)
    }

    componentDidMount() {
        super.componentDidMount();
    }

    render(){
        return [
            <Grid container>
                <Paper onClick={(_) => {this.setState({isCollapsed: !this.state.isCollapsed});}}>
                    <Typography>Bingo !</Typography>
                </Paper>
                { this.state.isCollapsed ? null : super.render() }
            </Grid>
        ];
    }
}