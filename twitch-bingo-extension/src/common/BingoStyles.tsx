import { makeStyles } from "@material-ui/core/styles";


export const bingoStyles = makeStyles({
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