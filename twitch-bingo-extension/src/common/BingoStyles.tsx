import makeStyles from "@material-ui/core/styles/makeStyles";

// Current palette
// https://coolors.co/fbf7ef-fff3d6-fae8bf-fae7b0-ffe6a7-ffe39d-ffe194


export const bingoStyles = makeStyles({
    paper: {
        background: '#FBF7EF',
        height: '100%',
        borderRadius: '0.25rem',
        userSelect: 'none',
        textAlign: 'center',
    },
    idle: {
        "&:hover": {
            cursor: 'pointer',
            background: '#FFF3D6'
        }
    },
    prompt: {
        background: '#FAE8BF',
        "&:hover": {
            cursor: 'pointer',
            background: '#FAE7B0'
        }
    },
    pending: {
        background: '#FFE6A7'
    },
    confirmed: {
        background: '#FFE194',
    },
    missed: {
        background: 'lightgray',
        color: '#666',
    },
    cancel: {
        background: 'rgba(220,128,128,0.8)',
    },
    confirm: {
        background: 'rgba(128,220,128,0.8)',
    },
    rejected: {
        background: 'lightgray',
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