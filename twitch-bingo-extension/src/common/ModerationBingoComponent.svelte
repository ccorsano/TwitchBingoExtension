<script lang="ts">
    import { DefaultEntry, type BingoEntry, type BingoTentativeNotification } from "../EBS/BingoService/EBSBingoTypes";
    import Paper, { Content } from '@smui/paper'
    import TentativeNotificationComponent from "./TentativeNotificationComponent.svelte";
    import ModerationBingoEntry from "./ModerationBingoEntry.svelte";
    import { GameModerationContextKey } from "../stores/moderation";
    import type { Readable } from "svelte/store";
    import { getContext } from "svelte";
    import type { BingoGameModerationContext } from "./BingoGameModerationContext";
    import LinearProgress from "@smui/linear-progress";
    import LL from "../i18n/i18n-svelte";

    export let entries: BingoEntry[]
    export let tentatives: BingoTentativeNotification[]
    export let confirmationTimeout: number
    export let onConfirm: (entry: BingoEntry) => void
    export let onTentativeExpire: (entry: BingoEntry) => void
    export let onTest: (entry: BingoEntry) => void | undefined

    const moderationContext: Readable<BingoGameModerationContext> = getContext(GameModerationContextKey)

    const onForceNotify = (entry: BingoEntry) => {
        $moderationContext.onForceNotify(entry)
    }

</script>

<Paper elevation={3} color={"default"}>
    <Content>
        <div>
            {#each tentatives as tentative}
            {#if tentative}
                <TentativeNotificationComponent
                    entry={entries.find(e => e.key === tentative.key) ?? DefaultEntry}
                    isConfirmed={tentative.confirmationTime != undefined}
                    referenceTime={tentative.tentativeTime}
                    confirmationTimeout={confirmationTimeout}
                    onConfirm={onConfirm}
                    onExpire={onTentativeExpire}
                />
            {/if}
            {/each}
        </div>
        <div>
            {#if entries?.length > 0}
                {#each entries as entry}
                    <ModerationBingoEntry
                        tentatives={tentatives}
                        entry={entry}
                        onConfirm={onConfirm}
                        onTest={onTest}
                        onForceNotify={onForceNotify}
                        />
                {/each}
            {:else}
                <div style:margin="1vw">
                    <LinearProgress indeterminate />
                    {$LL.BingoModeration.NoEntriesMessage()}
                </div>
            {/if}
        </div>
    </Content>
</Paper>