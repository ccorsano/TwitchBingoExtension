import React from "react"
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount'
import makeStyles from "@material-ui/core/styles/makeStyles"
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

const useStyles = makeStyles({
    pending: {
        background: 'linear-gradient(45deg, rgba(122,196,255,1) 33%, rgba(38,214,255,0.8) 90%);',
    },
    hidden: {
        width: '0px',
        left: '-3rem',
        opacity: 0,
    },
    shown: {
        width: 'unset',
        left: '0px',
        opacity: 1,
    }
  });

export default function VideoOverlayTabWidget(props: VideoOverlayTabWidgetProps) {
    const classes = useStyles();

    var moderationWidget: React.ReactElement = null;
    if (props.canModerate)
    {
        moderationWidget = (
            <div onClickCapture={props.onToggleModerationPane} className={clsx(props.hasModNotifications ? classes.pending : "", "tabWidget", props.shown ? classes.shown : classes.hidden)}>
                <SupervisorAccountIcon />
            </div>
        )
    }

    return (
        <div>
            <div className={clsx("tabWidget", props.shown ? classes.shown : classes.hidden)} onClickCapture={props.onToggleGrid}>
                <img src={BingoLogo} alt="Bingo Logo" />
            </div>
            { moderationWidget }
        </div>
    )
}