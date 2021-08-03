import makeStyles from "@material-ui/core/styles/makeStyles";
import { getHex, jasminePalette } from "./BingoThemes";

export const bingoStyles = makeStyles({
    paper: {
        background: getHex(jasminePalette.base),
        height: '100%',
        borderRadius: '0.25rem',
        userSelect: 'none',
        textAlign: 'center',
    },
    idle: {
        "&:hover": {
            cursor: 'pointer',
            background: getHex(jasminePalette.baseHover)
        }
    },
    prompt: {
        background: getHex(jasminePalette.prompt),
        "&:hover": {
            cursor: 'pointer',
            background: getHex(jasminePalette.promptHover),
        }
    },
    pending: {
        background: getHex(jasminePalette.pending)
    },
    confirmed: {
        background: getHex(jasminePalette.confirmed),
    },
    missed: {
        background: getHex(jasminePalette.missed),
        color: '#666',
    },
    cancel: {
        background: 'rgba(220,128,128,0.8)',
    },
    confirm: {
        background: 'rgba(128,220,128,0.8)',
    },
    rejected: {
        background: getHex(jasminePalette.missed),
        color: '#666',
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
    },
    bingoEntry: {
        paddingTop: '24px',
        paddingBottom: '24px',
        paddingLeft: '16px',
        paddingRight: '16px',
    },
    bingoCell: {
        transition: 'opacity 0.3s',
        position: 'relative',
        zIndex: 1,
        overflow: 'hidden',
    },
    bingoCellPrompt: {
        transition: 'all 0.5s',
        width: '100%',
        backgroundColor: 'rgba(255,243,214,0.9)', // #fff3d6
        boxShadow: '0px 0px 5px 0px rgba(0,0,0,0.2)',
        color: '#000',
        paddingTop: '0.5rem',
        paddingBottom: '0.5rem',
        zIndex: 10,
        position: 'absolute',
        bottom: '1rem',
    },
    bingoCellPromptVisible: {
        height: 'unset',
        opacity: 1.0,
        "&:hover": {
            cursor: 'pointer',
            backgroundColor: 'rgba(251,247,239,0.8)', // #fbf7ef
            boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.4)',
        }
    },
    bingoCellPromptHidden: {
        opacity: 0.0,
        bottom: '-2rem',
    },
    hiddenCell: {
        opacity: '0%',
    },
    visibleCell: {
        opacity: '100%',
        boxShadow: '0px 0px 0.4vw 0 rgb(0 0 0 / 50%)',
    }
  });