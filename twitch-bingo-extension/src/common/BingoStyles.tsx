import makeStyles from "@material-ui/core/styles/makeStyles";

export const bingoStyles = makeStyles({
    paper: {
        background: 'linear-gradient(45deg, rgba(255,255,255,0.8) 0%, rgba(200,200,200,0.8) 100%);',
        height: '100%',
        borderRadius: '1rem',
        userSelect: 'none',
        textAlign: 'center'
    },
    idle: {
        "&:hover": {
            cursor: 'pointer',
            background: 'linear-gradient(45deg, rgba(255,255,255,0.8) 100%, rgba(200,200,200,0.8) 0%);'
        }
    },
    prompt: {
        background: 'radial-gradient(circle, rgba(122,196,255,1) 33%, rgba(38,214,255,0.8) 90%);',
        "&:hover": {
            cursor: 'pointer',
            background: 'radial-gradient(circle, rgba(122,196,255,1) 50%, rgba(38,214,255,0.8) 100%);'
        }
    },
    pending: {
        background: 'linear-gradient(45deg, rgba(122,196,255,1) 33%, rgba(38,214,255,0.8) 90%);'
    },
    confirmed: {
        background: 'linear-gradient(45deg, rgba(223,255,50,0.8) 33%, rgba(151,255,124,0.8) 90%);',
    },
    missed: {
        background: 'linear-gradient(90deg, rgba(180,180,180,0.8) 30%, rgba(128,128,128,0.8) 90%);',
        color: '#333',
    },
    cancel: {
        background: 'linear-gradient(90deg, rgba(180,128,128,0.8) 30%, rgba(220,128,128,0.8) 90%);',
    },
    confirm: {
        background: 'linear-gradient(90deg, rgba(128,180,128,0.8) 30%, rgba(128,220,128,0.8) 90%);',
    },
    rejected: {
        background: 'linear-gradient(90deg, rgba(224,129,129,0.8) 30%, rgba(227,79,79,0.8) 90%);',
        color: '#333',
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
    }
  });