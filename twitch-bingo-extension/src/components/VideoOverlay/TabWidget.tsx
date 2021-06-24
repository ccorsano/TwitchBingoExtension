import React from "react";
require('./TabWidget.scss');

type VideoOverlayTabWidgetProps = {
    collapsed: boolean,
    onClick: (e: React.MouseEvent<any>) => void,
}

export default function VideoOverlayTabWidget(props: VideoOverlayTabWidgetProps) {
    return <div className="tabWidget" onClick={props.onClick}>
        BINGO
    </div>
}