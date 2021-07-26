import makeStyles from "@material-ui/core/styles/makeStyles";

export const bingoStyles = makeStyles({
    paper: {
        background: 'whitesmoke',
        height: '100%',
        borderRadius: '0.25rem',
        userSelect: 'none',
        textAlign: 'center',
    },
    idle: {
        "&:hover": {
            cursor: 'pointer',
            background: 'ghostwhite'
        }
    },
    prompt: {
        background: 'lightblue',
        "&:hover": {
            cursor: 'pointer',
            background: 'lightsteelblue'
        }
    },
    pending: {
        background: 'lightskyblue'
    },
    confirmed: {
        background: 'palegoldenrod',
    },
    missed: {
        background: 'lightgray',
        color: '#666',
    },
    cancel: {
        background: 'linear-gradient(90deg, rgba(180,128,128,0.8) 30%, rgba(220,128,128,0.8) 90%);',
    },
    confirm: {
        background: 'linear-gradient(90deg, rgba(128,180,128,0.8) 30%, rgba(128,220,128,0.8) 90%);',
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
    },
    hiddenCell: {
        opacity: '0%',
    },
    visibleCell: {
        opacity: '100%',
        boxShadow: '0px 0px 0.4vw 0 rgb(0 0 0 / 50%)',
    }
  });