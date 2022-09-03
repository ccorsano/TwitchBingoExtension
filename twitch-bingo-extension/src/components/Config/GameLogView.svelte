<script lang="ts">
import LinearProgress from "@smui/linear-progress"
import List from "@smui/list"
import dayjs from 'dayjs';
import GameLogItem from "./GameLogItem.svelte";
import type { BingoEntry, BingoLogEntry } from "../../EBS/BingoService/EBSBingoTypes"

export let entries: BingoEntry[]
export let logEntries: BingoLogEntry[]
export let isLoading: boolean

</script>

<style lang="scss">
    .gameLogList {
        max-height: 300px;
        overflow-y: scroll;
    }
</style>

{#if isLoading}
<LinearProgress variant='indeterminate' />
{:else}
<List class="gameLogList">
{#each logEntries as log,index}
{#key index}
<GameLogItem
    log={log}
    index={index}
    entry={entries.find(e => e.key === log.key)}
    parsedTime={dayjs(log.timestamp)} />
{/key}
{/each}
</List>
{/if}