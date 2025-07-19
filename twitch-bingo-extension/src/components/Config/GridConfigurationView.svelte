<script lang="ts">
    import { run } from 'svelte/legacy';

    import Card, { Actions, Content } from '@smui/card';
    import Slider from '@smui/slider'
    import { onMount } from 'svelte';
    import Paper from '@smui/paper'
    import Alert from '../../common/Alert.svelte'
    import LL from '../../i18n/i18n-svelte';
    import { FormatTimeout } from '../../EBS/BingoService/EBSBingoTypes';
    import Button from '@smui/button';

    interface Props {
        columns: number;
        rows: number;
        confirmationThresholdSeconds: number;
        selectedEntriesLength: number;
        onColumnsChange: (value: number) => void;
        onRowsChange: (value: number) => void;
        onConfirmationTimeoutChange: (value: number) => void;
        onSave: () => void;
        onStart: () => void;
        isStarting: boolean;
        canEnableChat: boolean;
    }

    let {
        columns,
        rows,
        confirmationThresholdSeconds,
        selectedEntriesLength,
        onColumnsChange,
        onRowsChange,
        onConfirmationTimeoutChange,
        onSave,
        onStart,
        isStarting,
        canEnableChat
    }: Props = $props();

    let editingColumns: number = $state(columns)
    let editingRows: number = $state(rows)
    let confirmationTimeout: number = $state(confirmationThresholdSeconds)

    let hasEnoughEntries = $derived(selectedEntriesLength >= rows * columns)
    let canStart = $derived(!isStarting && hasEnoughEntries)

    run(() => {
        onColumnsChange(editingColumns)
    });
    run(() => {
        onRowsChange(editingRows)
    });
    run(() => {
        onConfirmationTimeoutChange(confirmationTimeout)
    });
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
            {#snippet title()}
                                <h2 >{$LL.Config.AlertNotEnoughEntriesToFillTheGrid()}</h2>
                            {/snippet}
            {#snippet body()}
                            
                    {$LL.Config.AddEntriesOrReduceGridDimensionsToStartTheGame()}
                
                            {/snippet}
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
                {#snippet title()}
                                        <h2 >{$LL.Config.DeactivateChatIntegrationTitle()}</h2>
                                    {/snippet}
                {#snippet body()}
                                    
                        {$LL.Config.DeactivateChatIntegrationText()}
                    
                                    {/snippet}
            </Alert>
            {:else}
            <Alert severity="warning">
                {#snippet title()}
                                        <h2 >{$LL.Config.ActivateChatIntegrationTitle()}</h2>
                                    {/snippet}
                {#snippet body()}
                                    
                        {$LL.Config.ActivateChatIntegrationText()}
                    
                                    {/snippet}
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