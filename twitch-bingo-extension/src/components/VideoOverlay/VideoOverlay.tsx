import LinearProgress from '@material-ui/core/LinearProgress';
import React from 'react';
import { Suspense } from 'react';
import ViewerBingoComponentBase from '../../common/ViewerBingoComponentBase';
import { ViewerBingoComponentBaseState, ViewerBingoComponentBaseProps } from '../../common/ViewerBingoComponentBase';
import { BingoConfirmationNotification, BingoGame, ParseTimespan } from '../../EBS/BingoService/EBSBingoTypes';
const ModerationPane = React.lazy(() => import('./ModerationPane'));
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

    onTentativeNotification = () => {
        this.setState({
            moderationDrawerOpen: true,
            hasModNotifications: true,
        })
    }

    onConfirmationNotification = (confirmation: BingoConfirmationNotification) => {
        this.setState({
            entries: this.state.entries.map(entry => {
                if (entry.key == confirmation.key)
                {
                    return {
                        key: confirmation.key,
                        text: entry.text,
                        confirmedAt: confirmation.confirmationTime,
                        confirmedBy: confirmation.confirmedBy,
                    }
                }
                return entry
            })
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
                <Suspense fallback={<LinearProgress variant="indeterminate" />}>
                    <ModerationPane
                        isOpen={this.state.moderationDrawerOpen}
                        isStarted={this.state.isStarted}
                        onOpen={() => {this.setState({moderationDrawerOpen: true})}}
                        onClose={(_) => {this.setState({moderationDrawerOpen: false})}}
                        gameId={this.state.activeGame?.gameId}
                        confirmationTimeout={ParseTimespan(this.state.activeGame?.confirmationThreshold ?? "00:00:00")}
                        onReceiveTentative={this.onTentativeNotification}
                        onReceiveConfirmation={this.onConfirmationNotification}
                        onNotificationsEmpty={this.onNotificationsEmpty} />
                </Suspense>
            )
        }

        return [
            <div id="bingoRenderingArea">
                <div style={{ gridColumnStart: 1, gridColumnEnd: 4, gridRow: 1, height: '6rem', width: '100%' }}></div>
                <div style={{ gridColumn: 1, gridRow: 2 }}>
                    <VideoOverlayTabWidget
                        collapsed={this.state.isCollapsed}
                        canModerate={this.state.canModerate}
                        hasModNotifications={this.state.hasModNotifications}
                        onToggleGrid={(_) => {this.setState({isCollapsed: !this.state.isCollapsed});}}
                        onToggleModerationPane={(_) => {this.setState({moderationDrawerOpen: !this.state.moderationDrawerOpen})}} />
                    { this.state.canModerate ? moderationDrawer : null }
                </div>
                <div style={{ gridColumn: 2, gridRow: 2, width: '1fr' }}>
                    { this.state.isCollapsed ? null : super.render() }
                </div>
                <div style={{ gridColumn: 3, gridRow: 2, width: '7rem' }}>
                </div>
                <div style={{ gridColumnStart: 1, gridColumnEnd: 4, gridRow: 3, height: '6rem', width: '100%' }}></div>
            </div>
        ];
    }
}