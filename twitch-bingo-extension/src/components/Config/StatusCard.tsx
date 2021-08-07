import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Typography from '@material-ui/core/Typography'
import React from 'react'
import { I18nContext } from '../../i18n/i18n-react'

type StatusCardProps = {
    isActive: boolean;
    onStop: () => void;
}

export default function StatusCard(props: StatusCardProps)
{
    const { LL } = React.useContext(I18nContext)

    return (
        <Card>
            <CardHeader title={LL.Config.StatusCard.Title()} />
            <CardContent>
                {
                    props.isActive === true ?
                    <Typography>{LL.Config.StatusCard.StatusActive()}</Typography> :
                    <Typography>{LL.Config.StatusCard.StatusInactive()}</Typography>
                }
            </CardContent>
            <CardActions>
                {
                    props.isActive ? <Button variant="contained" color="secondary" onClick={props.onStop}>{LL.Config.StatusCard.StopButton()}</Button> : null
                }
            </CardActions>
        </Card>
    )
}