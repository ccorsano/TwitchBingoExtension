import React from "react";
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
require('./TabWidget.scss');
const BingoLogo = require('../../../assets/BingoLogo.svg');

type VideoOverlayTabWidgetProps = {
    collapsed: boolean,
    canModerate: boolean,
    onToggleGrid: (e: React.MouseEvent<any>) => void,
    onToggleModerationPane: (e: React.MouseEvent<any>) => void,
}

export default function VideoOverlayTabWidget(props: VideoOverlayTabWidgetProps) {

    var moderationWidget: React.ReactElement = null;
    if (props.canModerate)
    {
        moderationWidget = (
            <div className="tabWidget" onClick={props.onToggleModerationPane}>
                <SupervisorAccountIcon />
            </div>
        )
    }

    return (
        <div>
            <div className="tabWidget" onClick={props.onToggleGrid}>
                <img src={BingoLogo} alt="Bingo Logo" />
            </div>
            { moderationWidget }
        </div>
    )
}