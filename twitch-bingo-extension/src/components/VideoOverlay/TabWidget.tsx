import React from "react"
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount'
import { makeStyles } from "@material-ui/core/styles"
import clsx from 'clsx';
require('./TabWidget.scss')
const BingoLogo = require('../../../assets/BingoLogo.svg')

type VideoOverlayTabWidgetProps = {
    collapsed: boolean,
    canModerate: boolean,
    onToggleGrid: (e: React.MouseEvent<any>) => void,
    onToggleModerationPane: (e: React.MouseEvent<any>) => void,
    hasModNotifications?: boolean,
}

const useStyles = makeStyles({
    pending: {
        background: 'linear-gradient(45deg, rgba(122,196,255,1) 33%, rgba(38,214,255,0.8) 90%);',
    }
  });

export default function VideoOverlayTabWidget(props: VideoOverlayTabWidgetProps) {
    const classes = useStyles();

    var moderationWidget: React.ReactElement = null;
    if (props.canModerate)
    {
        moderationWidget = (
            <div onClick={props.onToggleModerationPane} className={clsx(props.hasModNotifications ? classes.pending : "", "tabWidget")}>
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