import React from "react"
import clsx from 'clsx';
require('./TabWidget.scss')
const BingoLogo = require('../../../assets/BingoLogo.svg')

type VideoOverlayTabWidgetProps = {
    shown: boolean,
    collapsed: boolean,
    canModerate: boolean,
    onToggleGrid: (e: React.MouseEvent<any>) => void,
    onToggleModerationPane: (e: React.MouseEvent<any>) => void,
    hasModNotifications?: boolean,
}

export default function VideoOverlayTabWidget(props: VideoOverlayTabWidgetProps) {
    var moderationWidget: React.ReactElement = null;
    if (props.canModerate)
    {
        moderationWidget = (
            <div onClickCapture={props.onToggleModerationPane} className={clsx(props.hasModNotifications ? "pending" : "", "tabWidget", props.shown ? "shown" : "hidden")}>
                <span style={{fontSize: '2rem'}}>⚔</span>
            </div>
        )
    }

    return (
        <div className={clsx("tabWidgetContainer")}>
            <div className={clsx("tabWidget", props.shown ? "shown" : "hidden")} onClickCapture={props.onToggleGrid}>
                <img src={BingoLogo} alt="Bingo Logo" />
            </div>
            { moderationWidget }
        </div>
    )
}