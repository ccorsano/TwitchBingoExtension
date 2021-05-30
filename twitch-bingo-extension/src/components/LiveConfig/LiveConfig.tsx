import * as React from 'react';
import { Paper } from '@material-ui/core'

type LiveConfigState = {

}

export default class LiveConfig extends React.Component<any, LiveConfigState> {
    state: LiveConfigState = {

    }

    constructor(props: any){
        super(props)
    }

    render(){
        return (
            <Paper>
                Live Config
            </Paper>
        )
    }
}