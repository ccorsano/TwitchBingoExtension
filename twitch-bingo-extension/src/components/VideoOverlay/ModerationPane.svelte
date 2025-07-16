<script lang="ts">
    import ModerationBingoComponent from "../../common/ModerationBingoComponent.svelte";
    import type { BingoGameModerationContext } from "../../common/BingoGameModerationContext";
    import type { Readable, Writable } from "svelte/store";
    import { getContext } from "svelte";
    import { GameModerationContextKey } from "../../stores/moderation";
    import type { BingoGameContext } from "../../common/BingoGameContext";
    import { GameContextKey } from "../../stores/game";
    import type { BingoEntry, BingoGame } from "../../EBS/BingoService/EBSBingoTypes";

    export let confirmationTimeout: number

    let gameModerationContext: Writable<BingoGameModerationContext> = getContext(GameModerationContextKey)
    let gameContext: Readable<BingoGameContext> = getContext(GameContextKey)
    let game:BingoGame|undefined = undefined
    let entries:BingoEntry[] = Array(0)

    $: game = $gameContext.game
    $: entries = $gameContext.game?.entries ?? Array(0)
</script>

<div>
    <div style:overflow-y="scroll">
        {#if game}
        <ModerationBingoComponent
            entries={entries ?? Array(0)}
            confirmationTimeout={confirmationTimeout}
            onConfirm={$gameModerationContext.onConfirm}
            onTentativeExpire={$gameModerationContext.onTentativeExpire}
            onTest={$gameModerationContext.onTestTentative}
            tentatives={$gameModerationContext.tentatives}
        />
        {/if}
    </div>
</div>