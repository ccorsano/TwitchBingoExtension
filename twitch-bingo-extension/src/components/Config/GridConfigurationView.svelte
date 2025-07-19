<script lang="ts">
    import Card, { Actions, Content } from '@smui/card';
    import Slider from '@smui/slider'
    import { onMount } from 'svelte';
    import Paper from '@smui/paper'
    import Alert from '../../common/Alert.svelte'
    import LL from '../../i18n/i18n-svelte';
    import { FormatTimeout } from '../../EBS/BingoService/EBSBingoTypes';
    import Button from '@smui/button';

    export let columns: number
    export let rows : number
    export let confirmationThresholdSeconds: number
    export let selectedEntriesLength: number
    export let onColumnsChange: (value: number) => void
    export let onRowsChange: (value: number) => void
    export let onConfirmationTimeoutChange: (value: number) => void
    export let onSave: () => void
    export let onStart: () => void
    export let isStarting: boolean
    export let canEnableChat: boolean

    let editingColumns: number = columns
    let editingRows: number = rows
    let confirmationTimeout: number = confirmationThresholdSeconds

    $: hasEnoughEntries = selectedEntriesLength >= rows * columns
    $: canStart = !isStarting && hasEnoughEntries

    $: onColumnsChange(editingColumns)
    $: onRowsChange(editingRows)
    $: onConfirmationTimeoutChange(confirmationTimeout)
</script>

<Card>
    <Content>
        <h2>{$LL.Config.ConfigureGrid()}</h2>
        <span>
            {$LL.Config.Columns()}: {columns}
        </span>
        <Slider
            defaultValue={columns}
            step={1}
            min={2}
            tickMarks
            max={5}
            bind:value={editingColumns}
        />
        <span>
            {$LL.Config.Rows()}: {rows}
        </span>
        <Slider
            defaultValue={rows}
            step={1}
            min={2}
            tickMarks
            max={5}
            bind:value={editingRows}
        />
        {#if !hasEnoughEntries}
        <Alert severity="error">
            <h2 slot="title">{$LL.Config.AlertNotEnoughEntriesToFillTheGrid()}</h2>
            <svelte:fragment slot="body">
                {$LL.Config.AddEntriesOrReduceGridDimensionsToStartTheGame()}
            </svelte:fragment>
        </Alert>
        {/if}
        <table style:width="100%">
            <tbody>
                {#each [...Array(rows).keys()] as r}
                <tr>
                    {#each [...Array(columns).keys()] as c}
                    <td style:width="auto">
                        <Paper className="paper" color={((r * columns + c) < selectedEntriesLength) ? "primary" : ""} elevation={3}>
                            <div style={"background-color: " + ((r * columns + c) < selectedEntriesLength) ? "primary.main" : "error.main"}>
                                &nbsp;
                            </div>
                        </Paper>
                    </td>
                    {/each}
                </tr>
                {/each}
            </tbody>
        </table>
        <span>{$LL.Config.ConfirmationTime()}: {FormatTimeout(confirmationThresholdSeconds)}</span>
        <Slider
            defaultValue={confirmationThresholdSeconds}
            step={10}
            min={30}
            tickMarks
            max={300}
            bind:value={confirmationTimeout}
        />
        <div>
            {#if canEnableChat}
            <Alert severity="info">
                <h2 slot="title">{$LL.Config.DeactivateChatIntegrationTitle()}</h2>
                <svelte:fragment slot="body">
                    {$LL.Config.DeactivateChatIntegrationText()}
                </svelte:fragment>
            </Alert>
            {:else}
            <Alert severity="warning">
                <h2 slot="title">{$LL.Config.ActivateChatIntegrationTitle()}</h2>
                <svelte:fragment slot="body">
                    {$LL.Config.ActivateChatIntegrationText()}
                </svelte:fragment>
            </Alert>
            {/if}
        </div>
    </Content>
    <Actions>
        <Button variant="unelevated" color="primary" on:click={onSave}>
            {$LL.Config.SaveGame()}
        </Button>
        <Button variant="unelevated" color="primary" on:click={onStart} disabled={!canStart}>
            {$LL.Config.StartGame()}
        </Button>
    </Actions>
</Card>