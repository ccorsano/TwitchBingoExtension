<script lang="ts">
    import TabWidget from "./TabWidget.svelte";
    import type { BingoGameContext } from "../../common/BingoGameContext"
    import { ParseTimespan, type BingoGame, type BingoGrid, type BingoTentativeNotification } from "../../EBS/BingoService/EBSBingoTypes";
    import OverlayBingoGrid from "./OverlayBingoGrid.svelte";
    import LL from '../../i18n/i18n-svelte';
    import BingoGameComponent from "../../common/BingoGameComponent.svelte";
    import type { Writable } from "svelte/store";
    import { onMount, setContext } from "svelte";
    import { createGameContext, GameContextKey } from "../../stores/game"
    import type { BingoGridContext } from "../../common/BingoGridContext";
    import { createGridContext, GridContextKey } from "../../stores/grid";
    import { TwitchExtHelper } from "../../common/TwitchExtension";

    let isCollapsed = true
    let isShowingIdentityPrompt = false
    let isWidgetShown = true
    let hasModNotifications = false
    let moderationDrawerOpen = false
    let isModDrawerAutoOpened = false
    let confirmationTimeout:number = 0.0

    const gameContext:Writable<BingoGameContext> = createGameContext()
    setContext(GameContextKey, gameContext)
    const gridContext:Writable<BingoGridContext> = createGridContext()
    setContext(GridContextKey, gridContext)

    $: confirmationTimeout = ParseTimespan($gameContext.game?.confirmationThreshold ?? "00:00:00")
    
    let layoutClass = "wide"

    onMount(() => {
        TwitchExtHelper.onContext((context, _) => {
            isWidgetShown = (context.arePlayerControlsVisible !== false)
            return () => {
                TwitchExtHelper.onContext(null)
            }
        })
    })

    function onTentativeNotification(_tentative: BingoTentativeNotification) {
        if (!moderationDrawerOpen)
        {
            isModDrawerAutoOpened = true
            moderationDrawerOpen = true
        }
        hasModNotifications = true
    }

    function onNotificationsEmpty() {
        if (isModDrawerAutoOpened)
        {
            moderationDrawerOpen = false
        }
        hasModNotifications = false
    }

    function drawingAreaClick() {
        if (! isCollapsed)
        {
            isCollapsed = true
        }
    }

    function onToggleGrid(gameContext:BingoGameContext)
    {
        if (gameContext === undefined)
        {
            return;
        }
        if (! gameContext.hasSharedIdentity)
        {
            isShowingIdentityPrompt = !isShowingIdentityPrompt
            return
        }
        isShowingIdentityPrompt = false
        isCollapsed = !isCollapsed
    }

    function onToggleModerationPane() {
        moderationDrawerOpen = !moderationDrawerOpen
        isModDrawerAutoOpened = false
        console.log(`Moderation pane ${moderationDrawerOpen ? "open" : "closed" }`)
    }

    function onSharedIdentityChange(isShared: boolean) {
        if (isShared && isShowingIdentityPrompt) {
            isShowingIdentityPrompt = false
        }
        if (!isShared && !isCollapsed) {
            isCollapsed = true
        }
    }

    function onReceiveGame(game: BingoGame) {
        console.log("Game received")
        if (game)
        {
            if (game.columns < 4)
            {
                layoutClass = "tall"
            }
            else
            {
                layoutClass = "wide"
            }
        }
    }

    function onRefreshGrid(grid: BingoGrid) {
        console.log("Grid refreshed")
    }
</script>

<style lang="scss">
    @use "../../common/BingoStyles.scss";
    @use "./VideoOverlay.scss";
</style>

<BingoGameComponent
    onReceiveGame={onReceiveGame}
    onRefreshGrid={onRefreshGrid}
    onSharedIdentity={onSharedIdentityChange}>
{#if $gameContext}
<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div id="bingoRenderingArea" class={layoutClass}>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div id="safeAreaTop" style="grid-column-start: 1; grid-column-end: 4; grid-row: 1; height: '14vh'; width: '100%';" on:click|self={drawingAreaClick}></div>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div class="action-area"
         class:moderationOpen={moderationDrawerOpen}
         style:grid-column="1"
         style:grid-row="2"
         style:height="75vh"
         on:click|self={drawingAreaClick}>
        <div style:grid-column="2" style:grid-row="1">
            <TabWidget
                shown={isWidgetShown}
                bind:moderationShown={moderationDrawerOpen}
                canModerate={$gameContext.canModerate}
                hasModNotifications={hasModNotifications}
                onToggleGrid={() => onToggleGrid($gameContext)} />
        </div>
        <div style:grid-column="1" style:grid-row="1">
            {#if $gameContext.canModerate}
                {#await import('./ModerationSection.svelte') then {default: ModerationSection }}
                    <ModerationSection
                        bind:open={moderationDrawerOpen}
                        confirmationTimeout={confirmationTimeout}
                        onReceiveTentative={onTentativeNotification}
                        onNotificationsEmpty={onNotificationsEmpty}
                    />
                {/await}
            {/if}
        </div>
    </div>
    <div id="bingoGridArea"
        style:grid-column="2"
        style:grid-row="2"
        style:width="1fr"
        style:margin-left="2vw"
        style:height="76vh"
        style:overflow="hidden">
        {#if isShowingIdentityPrompt }
            <div class="identityPrompt">
                    <div style:margin-bottom="2rem" style:margin-top="1rem">
                        {$LL.OverlayBingoGrid.IdentityPromptMessage()}
                    </div>
                    <!-- svelte-ignore a11y-click-events-have-key-events -->
                    <div
                        class="bandeauPrompt bandeauPromptVisible"
                        style:position="unset"
                        on:click={(_) => $gameContext.promptIdentity()}>
                        {$LL.OverlayBingoGrid.ShareIdentityButtonLabel()}
                    </div>
                </div>
        {/if}
        <OverlayBingoGrid
            isCollapsed={isCollapsed}
            layoutClass={layoutClass}
        />
    </div>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div style:grid-column="3" style:grid-row="2" style:width="7rem" style:height="75vh" on:click={drawingAreaClick}>
    </div>
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <div id="safeAreaBottom" style:grid-column-start="1" style:grid-column-end="4" style:grid-row="3" style:height="9vh" style:width="100%" on:click={drawingAreaClick}></div>
</div>
{/if}
</BingoGameComponent>