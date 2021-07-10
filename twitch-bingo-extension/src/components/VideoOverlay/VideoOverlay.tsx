import { Box, Grid } from '@material-ui/core';
import React from 'react';
import ViewerBingoComponentBase from '../../common/ViewerBingoComponentBase';
import { ViewerBingoComponentBaseState, ViewerBingoComponentBaseProps } from '../../common/ViewerBingoComponentBase';
import { ParseTimespan } from '../../EBS/BingoService/EBSBingoTypes';
import ModerationPane from './ModerationPane';
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
        moderationDrawerOpen: false,
    }

    constructor(props: VideoOverlayProps){
        super(props)
    }

    componentDidMount() {
        super.componentDidMount();
    }

    render(){
        var moderationDrawer: JSX.Element = null;
        if (this.state.canModerate)
        {
            moderationDrawer = (
                <ModerationPane
                    isOpen={this.state.moderationDrawerOpen}
                    isStarted={this.state.isStarted}
                    entries={this.state.entries}
                    onOpen={() => {this.setState({moderationDrawerOpen: true})}}
                    onClose={(_) => {this.setState({moderationDrawerOpen: false})}}
                    confirmationTimeout={ParseTimespan(this.state.activeGame?.confirmationThreshold ?? "00:00:00")} />
            )
        }

        return [
            <Grid container>
                <Box id="bingoRenderingArea">
                    <VideoOverlayTabWidget
                        collapsed={this.state.isCollapsed}
                        canModerate={this.state.canModerate}
                        onToggleGrid={(_) => {this.setState({isCollapsed: !this.state.isCollapsed});}}
                        onToggleModerationPane={(_) => {this.setState({moderationDrawerOpen: !this.state.moderationDrawerOpen})}} />
                    { this.state.isCollapsed ? null : super.render() }
                    { this.state.canModerate ? moderationDrawer : null }
                </Box>
            </Grid>
        ];
    }
}