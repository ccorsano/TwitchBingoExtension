<script lang="ts">
    import type { Writable } from "svelte/store";
    import BingoGameModerationComponent from "../../common/BingoGameModerationComponent.svelte";
    import ModerationPane from "./ModerationPane.svelte";
    import { createGameModerationContext, GameModerationContextKey } from "../../stores/moderation";
    import type { BingoGameModerationContext } from "../../common/BingoGameModerationContext";
    import { getContext, setContext } from "svelte";
    import type { BingoTentative, BingoTentativeNotification } from "../../EBS/BingoService/EBSBingoTypes";
    import type { BingoGameContext } from "../../common/BingoGameContext";
    import { GameContextKey } from "../../stores/game";

    interface Props {
        open?: boolean;
        confirmationTimeout: number;
        onNotificationsEmpty?: (() => void) | undefined;
        onReceiveTentative?: ((tentative: BingoTentativeNotification) => void) | undefined;
    }

    let {
        open = false,
        confirmationTimeout,
        onNotificationsEmpty = undefined,
        onReceiveTentative = undefined
    }: Props = $props();


    const gameModerationContext:Writable<BingoGameModerationContext> = createGameModerationContext()
    setContext(GameModerationContextKey, gameModerationContext)
    const gameContext:Writable<BingoGameContext> = getContext(GameContextKey)

    function onConfirmationNotification(tentative: BingoTentative) {
        gameModerationContext.update(gmc => {
            gmc.tentatives = $gameModerationContext.tentatives.filter(t => t.key.toString() != tentative.entryKey)
            return gmc
        })
        gameContext.update(gc => {
            var entry = gc.game?.entries.find(e => e.key.toString() == tentative.entryKey)
            if (entry)
            {
                entry.confirmedBy = ""
                entry.confirmedAt = new Date()
            }
            return gc
        })
        if ($gameContext.game)
        {
            $gameContext.requestRefresh($gameContext.game.gameId)
        }
    }
</script>

<style lang="scss">
    @use "../../common/BingoTheme.scss";

// Using global to apply nice transition styling deep down in the component hierarchy
 :global(.drawer-container) {
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    overflow-y: scroll;
    border-bottom-right-radius: 0.25rem;
    height: 75vh;

    opacity: 1;
    background-color: BingoTheme.$panel-background-color;
    padding: 0.3rem;
  }

  :global(.drawer-container.closed) {
    opacity: 0;
    transition: 0.5s ease-in 0.0s;
  }

  :global(.drawer-container.closed div) {
    text-overflow: clip;
    overflow: hidden;
  }
</style>

<BingoGameModerationComponent
    onReceiveConfirmation={onConfirmationNotification}
    onNotificationsEmpty={onNotificationsEmpty}
    onReceiveTentative={onReceiveTentative}
    >
    <div class="drawer-container" class:open={open} class:closed={!open}>
        <ModerationPane
            confirmationTimeout={confirmationTimeout}
        />
    </div>
</BingoGameModerationComponent>