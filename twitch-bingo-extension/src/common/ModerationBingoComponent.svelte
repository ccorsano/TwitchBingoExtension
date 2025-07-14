<script lang="ts">
    import type { BingoEntry, BingoTentativeNotification } from "src/EBS/BingoService/EBSBingoTypes";
    import Paper from '@smui/paper'

    export let entries: BingoEntry[]
    export let tentatives: BingoTentativeNotification[]
    export let isStarted: boolean
    export let gameId: string
    export let confirmationTimeout: number
    export let onConfirm: (entry: BingoEntry) => void
    export let onTentativeExpire: (entry: BingoEntry) => void
    export let onTest: (entry: BingoEntry) => void | undefined


</script>

<Paper elevation="3">
    <div>
        {#each tentatives as tentative}
        {#if tentative}
            
        {/if}
        {/each}

        
                    props.tentatives.map((tentative) => {
                        if (tentative)
                        {
                            var entry: BingoEntry = props.entries.find(e => e.key == tentative.key);

                            return (
                                <TentativeNotificationComponent
                                    gameId={tentative.gameId}
                                    entry={entry}
                                    isConfirmed={tentative.confirmationTime != null}
                                    referenceTime={tentative.confirmationTime ?? tentative.tentativeTime}
                                    key={tentative.key}
                                    confirmationTimeout={props.confirmationTimeout}
                                    onConfirm={props.onConfirm}
                                    onExpire={props.onTentativeExpire}
                                />
                            );
                        }
                    })
    </div>
</Paper>