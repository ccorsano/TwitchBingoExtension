<script lang="ts">
    import type { BingoEntry, BingoTentativeNotification } from "src/EBS/BingoService/EBSBingoTypes";
    import { TwitchExtQuery } from "./TwitchExtension";
    import Button, { Group } from "@smui/button";
    import LL from "../i18n/i18n-svelte";
    import dayjs from "dayjs";
    import relativeTime from "dayjs/plugin/relativeTime"

    export let tentatives: BingoTentativeNotification[]
    export let entry: BingoEntry
    export let onConfirm: (e:BingoEntry) => void
    export let onTest: (e:BingoEntry) => void
    export let onForceNotify: (e:BingoEntry) => void

    dayjs.extend(relativeTime)

    let tentative:BingoTentativeNotification | undefined = undefined
    let isConfirmed = false
    $: tentative = tentatives.find(t => t.key == entry.key)
    $: isConfirmed = entry.confirmedAt != null
</script>


{#if !tentative}
    <div class:confirmed={isConfirmed} class:idle={!isConfirmed} style:display="grid" style:grid-auto-columns="1fr auto" style:padding="0.5rem">
        <div style:grid-column="1" style:display="inline-grid" title={entry.text}>
            <div>{entry.text}</div>
            {#if isConfirmed}
                <div>
                    <small>{$LL.BingoModeration.ConfirmedByMessage({confirmedAt:dayjs(entry.confirmedAt).fromNow(), confirmedBy:entry.confirmedBy})}</small>
                </div>
            {/if}
        </div>
        <div style:grid-column="2" style:display="inline-grid" style:padding-left="0.5rem">
            <Group size="small" style={{display:'inline-block'}}>
                <Button aria-label={$LL.BingoModeration.ConfirmButtonLabel()} on:click={() => onConfirm(entry)} disabled={isConfirmed}>
                    {isConfirmed ? $LL.BingoModeration.ConfirmedLabel() : $LL.BingoModeration.ConfirmButton()}
                </Button>
                {#if TwitchExtQuery.state === "testing"}
                    <Button aria-label="Test" on:click={() => onTest(entry)}>Test</Button>
                    <Button aria-label="Notify" on:click={() => onForceNotify(entry)}>‼</Button>
                {/if}
            </Group>
        </div>
    </div>
{/if}
