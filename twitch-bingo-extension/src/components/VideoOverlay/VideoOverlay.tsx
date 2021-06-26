import { Box, Grid } from '@material-ui/core';
import React from 'react';
import ViewerBingoComponentBase from '../../common/ViewerBingoComponentBase';
import { ViewerBingoComponentBaseState, ViewerBingoComponentBaseProps } from '../../common/ViewerBingoComponentBase';
import VideoOverlayTabWidget from './TabWidget';
require('./VideoOverlay.scss');

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
        pendingResults: new Array(0),
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
                <Box id="bingoRenderingArea">
                    <VideoOverlayTabWidget collapsed={this.state.isCollapsed} onClick={(_) => {this.setState({isCollapsed: !this.state.isCollapsed});}} />
                    { this.state.isCollapsed ? null : super.render() }
                </Box>
            </Grid>
        ];
    }
}