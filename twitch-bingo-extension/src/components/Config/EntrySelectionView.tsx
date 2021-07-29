import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import RemoveCircleOutline from '@material-ui/icons/RemoveCircleOutline';
import React from 'react'
import { BingoEditableEntry } from '../../model/BingoEntry';

type EntrySelectionViewProps = {
    entries: BingoEditableEntry[],
    selectedEntries: number[],
    onAddToSelection: (entry: BingoEditableEntry) => void,
    onRemoveFromSelection: (entry: BingoEditableEntry) => void,
}

export default function EntrySelectionView(props:EntrySelectionViewProps)
{
    var targetListElement: JSX.Element = null;
    if (props.selectedEntries.length == 0)
    {
        targetListElement = <Typography><em>No items selected</em></Typography>
    }
    else
    {
        targetListElement = <List>
            {
                props.selectedEntries.map(key => {
                    var entry:BingoEditableEntry = props.entries.find(b => b.key == key);
                    return <ListItem button onClick={() => props.onRemoveFromSelection(entry)}>
                        <ListItemText
                            primary={entry.text}
                        />
                        <IconButton onClick={() => props.onRemoveFromSelection(entry)}>
                            <Icon>
                                <RemoveCircleOutline />
                            </Icon>
                        </IconButton>
                    </ListItem>
                })
            }
        </List>;
    }

    return (
        <Card>
            <CardHeader title="Selection" subheader="These are the bingo entries currently selected for the next game."/>
            <CardContent>
                { targetListElement }
            </CardContent>
        </Card>
    )
}