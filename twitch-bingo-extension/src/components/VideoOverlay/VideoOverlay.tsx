import { Box, Grid } from '@material-ui/core';
import React from 'react';
import ViewerBingoComponentBase from '../../common/ViewerBingoComponentBase';
import { ViewerBingoComponentBaseState, ViewerBingoComponentBaseProps } from '../../common/ViewerBingoComponentBase';
import { BingoGame, ParseTimespan } from '../../EBS/BingoService/EBSBingoTypes';
import ModerationPane from './ModerationPane';
import VideoOverlayTabWidget from './TabWidget';
require('./VideoOverlay.scss');

interface VideoOverlayState extends ViewerBingoComponentBaseState {
    isCollapsed: boolean;
    hasModNotifications: boolean;
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
        hasModNotifications: false,
    }

    constructor(props: VideoOverlayProps){
        super(props)
    }

    componentDidMount() {
        super.componentDidMount();
    }

    onStart(payload: BingoGame) {
        super.onStart(payload);
        this.setState({entries : payload.entries});
    };

    onTentative = () => {
        this.setState({
            moderationDrawerOpen: true,
            hasModNotifications: true,
        })
    }

    onNotificationsEmpty = () => {
        this.setState({
            moderationDrawerOpen: false,
            hasModNotifications: false,
        })
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
                    gameId={this.state.activeGame?.gameId}
                    confirmationTimeout={ParseTimespan(this.state.activeGame?.confirmationThreshold ?? "00:00:00")}
                    onReceiveTentative={this.onTentative}
                    onNotificationsEmpty={this.onNotificationsEmpty} />
            )
        }

        return [
            <Grid container>
                <Box id="bingoRenderingArea">
                    <VideoOverlayTabWidget
                        collapsed={this.state.isCollapsed}
                        canModerate={this.state.canModerate}
                        hasModNotifications={this.state.hasModNotifications}
                        onToggleGrid={(_) => {this.setState({isCollapsed: !this.state.isCollapsed});}}
                        onToggleModerationPane={(_) => {this.setState({moderationDrawerOpen: !this.state.moderationDrawerOpen})}} />
                    { this.state.isCollapsed ? null : super.render() }
                    { this.state.canModerate ? moderationDrawer : null }
                </Box>
            </Grid>
        ];
    }
}