<script lang="ts">
    import { run } from 'svelte/legacy';

    import ModerationBingoComponent from "../../common/ModerationBingoComponent.svelte";
    import type { BingoGameModerationContext } from "../../common/BingoGameModerationContext";
    import type { Readable, Writable } from "svelte/store";
    import { getContext } from "svelte";
    import { GameModerationContextKey } from "../../stores/moderation";
    import type { BingoGameContext } from "../../common/BingoGameContext";
    import { GameContextKey } from "../../stores/game";
    import type { BingoEntry, BingoGame } from "../../EBS/BingoService/EBSBingoTypes";
    import LinearIndeterminateLoader from "../../common/LinearIndeterminateLoader.svelte";
    import LL from "../../i18n/i18n-svelte";

    interface Props {
        confirmationTimeout: number;
    }

    let { confirmationTimeout }: Props = $props();

    let gameModerationContext: Writable<BingoGameModerationContext> = getContext(GameModerationContextKey)
    let gameContext: Readable<BingoGameContext> = getContext(GameContextKey)
    let game:BingoGame|undefined = $state(undefined)
    let entries:BingoEntry[] = $state(Array(0))

    run(() => {
        game = $gameContext.game
    });
    run(() => {
        entries = $gameContext.game?.entries ?? Array(0)
    });
</script>

<div>
    <div>
        {#if game}
        <ModerationBingoComponent
            entries={entries ?? Array(0)}
            confirmationTimeout={confirmationTimeout}
            onConfirm={$gameModerationContext.onConfirm}
            onTentativeExpire={$gameModerationContext.onTentativeExpire}
            onTest={$gameModerationContext.onTestTentative}
            tentatives={$gameModerationContext.tentatives}
        />
        {:else}
        <LinearIndeterminateLoader style="margin-bottom: 1rem; margin-top: 1rem" />
        <div style="margin-top: 2rem; text-align: center;">
            {$LL.OverlayBingoGrid.WaitingMessage()}
        </div>
        {/if}
    </div>
</div>