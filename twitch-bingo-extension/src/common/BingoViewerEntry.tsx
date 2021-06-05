import { Box, Button, Paper, Typography } from "@material-ui/core";
import React from "react";
import clsx from 'clsx';
import { makeStyles } from '@material-ui/core/styles';
import { BingoEntry, BingoEntryState } from "../model/BingoEntry";

const useStyles = makeStyles({
    paper: {
        background: 'linear-gradient(45deg, rgba(255,255,255,0.8) 0%, rgba(200,200,200,0.8) 100%);',
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
        background: 'radial-gradient(45deg, rgba(195,195,195,0.80) 30%, rgba(205,205,205,0.90) 90%);',
    },
  });

type BingoViewerEntryProps = {
    config: BingoEntry,
    canInteract: boolean,
    canConfirm: boolean,
    onTentative: (entry: BingoEntry) => void,
    onConfirm: (entry: BingoEntry) => void,
}

export default function BingoViewerEntry(props: BingoViewerEntryProps) {
    const classes = useStyles();
    const [state, setState] = React.useState<BingoEntryState>(BingoEntryState.Idle);

    const handleTentative = (_event: React.MouseEvent<HTMLButtonElement>) => {
        setState(BingoEntryState.Pending);
        props.onTentative(props.config);
    };
    const handleConfirm = (_event: React.MouseEvent<HTMLButtonElement>) => {
        setState(BingoEntryState.Confirmed);
        props.onConfirm(props.config);
    };

    let stateClass = classes.idle;
    switch(state)
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
        default:
            break;
    }

    return (
        <Paper elevation={3} className={clsx(classes.paper, stateClass)}>
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