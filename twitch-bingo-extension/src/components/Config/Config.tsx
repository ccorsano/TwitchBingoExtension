import * as React from 'react';
import { Paper } from '@material-ui/core'

type ConfigState = {

}

export default class Config extends React.Component<any, ConfigState> {
    state: ConfigState = {

    }

    constructor(props: any){
        super(props)
    }

    render(){
        return (
            <Paper>
                Config
            </Paper>
        )
    }
}