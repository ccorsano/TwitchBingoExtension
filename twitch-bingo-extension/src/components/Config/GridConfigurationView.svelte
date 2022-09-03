<script lang="ts">
    import Card, { Actions, Content } from '@smui/card';
    import LayoutGrid, { Cell } from '@smui/layout-grid'
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

    let editingColumns: number = 3
    let editingRows: number = 3
    let confirmationTimeout: number = 120

    onMount(() => {
        editingColumns = columns
        editingRows = rows
        confirmationTimeout = confirmationThresholdSeconds
    })

    $: hasEnoughEntries = selectedEntriesLength >= rows * columns
    $: canStart = !isStarting && hasEnoughEntries

    $: {
        onColumnsChange(editingColumns)
    }
    $: {
        onRowsChange(editingRows)
    }
    $: {
        onConfirmationTimeoutChange(confirmationTimeout)
    }
</script>

<Card>
    <Content>
        <h2>{$LL.Config.ConfigureGrid()}</h2>
        <span>
            {$LL.Config.Columns()}
        </span>
        <Slider
            defaultValue={3}
            step={1}
            min={2}
            tickMarks
            max={5}
            bind:value={editingColumns}
        />
        <span>
            {$LL.Config.Rows()}
        </span>
        <Slider
            defaultValue={3}
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
        <LayoutGrid container>
            {#each [...Array(rows).keys()] as r}
            <LayoutGrid container item xs={12} spacing={1} key={r}>
                {#each [...Array(columns).keys()] as c}
                <Cell item xs key={c}>
                    <Paper className="paper" elevation={3}>
                        <div style={"background-color: " + ((r * columns + c) < selectedEntriesLength) ? "primary.main" : "error.main"}>
                            &nbsp;
                        </div>
                    </Paper>
                </Cell>
                {/each}
            </LayoutGrid>
            {/each}
        </LayoutGrid>
        <span>
            {$LL.Config.ConfirmationTime()}
        </span>
        <Slider
            defaultValue={120}
            step={10}
            min={30}
            tickmMarks
            max={300}
            valueLabelDisplay="auto"
            valueLabelFormat={FormatTimeout(confirmationTimeout)}
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
        <Button variant="unelevated" color="primary" onClick={onSave}>
            {$LL.Config.SaveGame()}
        </Button>
        <Button variant="unelevated" color="primary" onClick={onStart} disabled={!canStart}>
            {$LL.Config.StartGame()}
        </Button>
    </Actions>
</Card>