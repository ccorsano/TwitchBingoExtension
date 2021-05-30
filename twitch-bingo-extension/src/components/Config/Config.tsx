import * as React from 'react';
import { Container, List } from '@material-ui/core'
import EditableBingoEntry from './EditableBingoEntry';

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
            <Container>
                Config
                
                <List>
                    <EditableBingoEntry value="Blah blah blah 1" isNew={false} />
                    <EditableBingoEntry value="Blah blah blah 2" isNew={false} />
                    <EditableBingoEntry value="Blah blah blah 3" isNew={false} />
                    <EditableBingoEntry value="Blah blah blah 4" isNew={false} />
                </List>
            </Container>
        )
    }
}