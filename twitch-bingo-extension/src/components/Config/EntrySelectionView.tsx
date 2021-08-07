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
import { I18nContext } from '../../i18n/i18n-react';
import { BingoEditableEntry } from '../../model/BingoEntry';

type EntrySelectionViewProps = {
    entries: BingoEditableEntry[],
    selectedEntries: number[],
    onAddToSelection: (entry: BingoEditableEntry) => void,
    onRemoveFromSelection: (entry: BingoEditableEntry) => void,
}

export default function EntrySelectionView(props:EntrySelectionViewProps)
{
    const { LL } = React.useContext(I18nContext)
    
    var targetListElement: JSX.Element = null;
    if (props.selectedEntries.length == 0)
    {
        targetListElement = <Typography><em>{LL.Config.EntrySelectionView.NoItemMessage()}</em></Typography>
    }
    else
    {
        targetListElement = <List>
            {
                props.selectedEntries.map(key => {
                    var entry:BingoEditableEntry = props.entries.find(b => b.key == key);
                    return <ListItem button onClick={() => props.onRemoveFromSelection(entry)} key={key}>
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
            <CardHeader title={LL.Config.EntrySelectionView.Title()} subheader={LL.Config.EntrySelectionView.TitleSubHeader()} />
            <CardContent>
                { targetListElement }
            </CardContent>
        </Card>
    )
}