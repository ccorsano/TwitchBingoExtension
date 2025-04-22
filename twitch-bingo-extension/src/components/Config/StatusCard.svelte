<script lang="ts">
import Card, { Content, Actions } from "@smui/card"
import Button from "@smui/button"
import IconButton from "@smui/icon-button"
import LinearProgress from '@smui/linear-progress'
import type { BingoEntry, BingoLogEntry } from "../../EBS/BingoService/EBSBingoTypes";
import GameLogView from "./GameLogView.svelte";
import LL from "../../i18n/i18n-svelte";

export let isLoading: boolean
export let isActive: boolean
export let entries: BingoEntry[] | undefined
export let logEntries: BingoLogEntry[]
export let isLoadingLog: boolean
export let onRefreshLog: () => void
export let onStop: () => void
</script>

<Card>
    <div style="padding: 1rem;">
        <h2 class="mdc-typography--headline6" style="margin: 0;">
            {$LL.Config.StatusCard.Title()}
        </h2>
    </div>
    <Content>
        {#if isLoading}
        <div style="margin: '1vw'">
            <LinearProgress variant="indeterminate" />
            <div class='mdc-typography--body1'>{$LL.Config.StatusCard.LoadingConfiguration()}</div>
        </div>
        {:else if isActive === true}
        <h2 class="mdc-typography--h5">{$LL.Config.StatusCard.StatusActive()}</h2>
        {:else}
        <h2 class="mdc-typography--h5">{$LL.Config.StatusCard.StatusInactive()}</h2>
        {/if}
    </Content>
    <Actions>
        {#if isActive}
            <Button variant="unelevated" color="secondary" on:click={onStop}>{$LL.Config.StatusCard.StopButton()}</Button>
        {/if}
    </Actions>
    <Content>
        {#if !isLoading && isActive}
        <h2 class="mdc-typography--h5">
            {$LL.Config.GameLog.Header()}
            <IconButton onclick={onRefreshLog} disabled={isLoadingLog}>
                refresh
            </IconButton>
        </h2>
        <GameLogView
            isLoading={isLoadingLog && logEntries.length == 0}
            entries={entries!}
            logEntries={logEntries} />
        {/if}
    </Content>
</Card>