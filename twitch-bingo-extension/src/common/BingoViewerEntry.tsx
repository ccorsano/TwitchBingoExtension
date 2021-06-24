import { Box, Button, Paper, Typography } from "@material-ui/core";
import React from "react";
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { BingoEntry, BingoEntryState } from "../model/BingoEntry";

const useStyles = makeStyles({
    paper: {
        background: 'linear-gradient(45deg, rgba(255,255,255,0.8) 0%, rgba(200,200,200,0.8) 100%);',
        height: '95%',
    },
    idle: {

    },
    pending: {
        background: 'linear-gradient(45deg, rgba(122,196,255,1) 33%, rgba(38,214,255,0.8) 90%);',
    },
    confirmed: {
        background: 'linear-gradient(45deg, rgba(223,255,50,0.8) 33%, rgba(151,255,124,0.8) 90%);',
    },
    missed: {
        background: 'linear-gradient(90deg, rgba(180,180,180,0.8) 30%, rgba(128,128,128,0.8) 90%);',
    },
    rejected: {
        background: 'linear-gradient(90deg, rgba(224,129,129,0.8) 30%, rgba(227,79,79,0.8) 90%);',
    },
    colConfirmed: {
        borderLeftStyle: 'solid',
        borderLeftColor: 'black',
        borderRightStyle: 'solid',
        borderRightColor: 'black',
    },
    rowConfirmed: {
        borderTopStyle: 'solid',
        borderTopColor: 'black',
        borderBottomStyle: 'solid',
        borderBottomColor: 'black',
    }
  });

type BingoViewerEntryProps = {
    config: BingoEntry,
    state: BingoEntryState,
    canInteract: boolean,
    canConfirm: boolean,
    isRowCompleted: boolean,
    isColCompleted: boolean,
    onTentative: (entry: BingoEntry) => void,
    onConfirm: (entry: BingoEntry) => void,
}

export default function BingoViewerEntry(props: BingoViewerEntryProps) {
    const classes = useStyles();

    const handleTentative = (_event: React.MouseEvent<HTMLButtonElement>) => {
        props.onTentative(props.config);
    };
    const handleConfirm = (_event: React.MouseEvent<HTMLButtonElement>) => {
        props.onConfirm(props.config);
    };

    let stateClass = classes.idle;
    switch(props.state)
    {
        case BingoEntryState.Confirmed:
            stateClass = classes.confirmed;
            break;
        case BingoEntryState.Missed:
            stateClass = classes.missed;
            break;
        case BingoEntryState.Pending:
            stateClass = classes.pending;
            break;
        case BingoEntryState.Rejected:
            stateClass = classes.rejected;
            break;
        default:
            break;
    }

    return (
        <Paper elevation={3} className={clsx(classes.paper, stateClass, props.isColCompleted ? classes.colConfirmed : '', props.isRowCompleted ? classes.rowConfirmed : '')}>
            <Box py={3} my={0.5} px={2}>
                <Typography>
                    {props.config.text}
                </Typography>
                { props.canInteract ? <Button onClick={handleTentative}>Bingo !</Button> : null}
                { props.canConfirm ? <Button onClick={handleConfirm}>Confirm</Button> : null}
            </Box>
        </Paper>
    )
}