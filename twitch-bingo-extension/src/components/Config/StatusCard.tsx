import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Typography from '@material-ui/core/Typography'
import React from 'react'

type StatusCardProps = {
    isActive: boolean;
    onStop: () => void;
}

export default function StatusCard(props: StatusCardProps)
{
    return (
        <Card>
            <CardHeader title="Status" />
            <CardContent>
                {
                    props.isActive != null ?
                    <Typography>Active</Typography> :
                    <Typography>Inactive</Typography>
                }
            </CardContent>
            <CardActions>
                {
                    props.isActive ? <Button variant="contained" color="secondary" onClick={props.onStop}>Stop game</Button> : null
                }
            </CardActions>
        </Card>
    )
}