<script lang="ts">
    import LinearProgress from "@smui/linear-progress"
    import List from "@smui/list"
    import dayjs from 'dayjs';
    import GameLogItem from "./GameLogItem.svelte";
    import type { BingoEntry, BingoLogEntry } from "../../EBS/BingoService/EBSBingoTypes"

    interface Props {
        entries: BingoEntry[];
        logEntries: BingoLogEntry[];
        isLoading: boolean;
    }

    let { entries, logEntries, isLoading }: Props = $props();
</script>

<style lang="scss">
    :global(.gameLogList) {
        max-height: 300px;
        overflow-y: scroll;
    }
</style>

{#if isLoading}
<LinearProgress indeterminate />
{:else}
<List class="gameLogList" twoLine>
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