import Box from '@material-ui/core/Box'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import CardHeader from '@material-ui/core/CardHeader'
import Grid from '@material-ui/core/Grid'
import Paper from '@material-ui/core/Paper'
import Slider from '@material-ui/core/Slider'
import Typography from '@material-ui/core/Typography'
import Alert from '@material-ui/lab/Alert'
import AlertTitle from '@material-ui/lab/AlertTitle'
import React from 'react'
import { FormatTimeout } from '../../EBS/BingoService/EBSBingoTypes'
import { I18nContext } from '../../i18n/i18n-react'

type GridConfigurationViewProps = {
    columns: number;
    rows: number;
    confirmationThresholdSeconds: number;
    selectedEntriesLength: number;
    onColumnsChange: (value: number) => void;
    onRowsChange: (value: number) => void;
    onConfirmationTimeoutChange: (value: number) => void;
    onSave: () => void;
    onStart: () => void;
}

export default function GridConfigurationView(props:GridConfigurationViewProps)
{
    const { LL } = React.useContext(I18nContext)

    const canStart = (): boolean => props.selectedEntriesLength >= props.rows * props.columns;

    return (
        <Card>
            <CardHeader title={LL.Config.ConfigureGrid()} />
            <CardContent>
                <Typography>
                    {LL.Config.Columns()}
                </Typography>
                <Slider
                    defaultValue={3}
                    step={1}
                    min={2}
                    marks
                    max={5}
                    valueLabelDisplay="auto"
                    value={props.columns}
                    onChange={(_, value) => props.onColumnsChange(value as number)}
                />
                <Typography>
                    {LL.Config.Rows()}
                </Typography>
                <Slider
                    defaultValue={3}
                    step={1}
                    min={2}
                    marks
                    max={5}
                    valueLabelDisplay="auto"
                    value={props.rows}
                    onChange={(_, value) => props.onRowsChange(value as number)}
                />
                { !canStart() ? 
                    <Alert severity="error">
                        <AlertTitle>{LL.Config.AlertNotEnoughEntriesToFillTheGrid()}</AlertTitle>
                        {LL.Config.AddEntriesOrReduceGridDimensionsToStartTheGame()}
                    </Alert>
                     : null }
                <Grid container>
                {
                    [...Array(props.rows).keys()].map(r => {
                        return <Grid container item xs={12} spacing={1} key={r}>
                            {
                                [...Array(props.columns).keys()].map(c => {
                                    return <Grid item xs key={c}>
                                        <Paper className="paper" elevation={3}>
                                            <Box py={2} my={0.5} bgcolor={ (r * props.columns + c) < props.selectedEntriesLength ? "primary.main" : "error.main" }>
                                                <Typography>
                                                    
                                                </Typography>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                })
                            }
                        </Grid>
                    })
                }
                </Grid>
                <Typography>
                    {LL.Config.ConfirmationTime()}
                </Typography>
                <Slider
                    defaultValue={120}
                    step={10}
                    min={30}
                    marks
                    max={300}
                    valueLabelDisplay="auto"
                    valueLabelFormat={FormatTimeout(props.confirmationThresholdSeconds)}
                    value={props.confirmationThresholdSeconds}
                    onChange={(_, value) => props.onConfirmationTimeoutChange(value as number)}
                />
            </CardContent>
            <CardActions>
                <Button variant="contained" color="primary" onClick={props.onSave}>
                    {LL.Config.SaveGame()}
                </Button>
                <Button variant="contained" color="primary" onClick={props.onStart} disabled={!canStart()}>
                    {LL.Config.StartGame()}
                </Button>
            </CardActions>
        </Card>
    )
}