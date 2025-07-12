<script lang="ts">
    import TabWidget from "./TabWidget.svelte";
    import type { BingoGameContext } from "../../common/BingoGameContext"
    import type { BingoEntry, BingoGame, BingoGrid } from "src/EBS/BingoService/EBSBingoTypes";
    import OverlayBingoGrid from "./OverlayBingoGrid.svelte";
    import LL from '../../i18n/i18n-svelte';
    import BingoGameComponent from "../../common/BingoGameComponent.svelte";
    import type { Writable } from "svelte/store";
    import { setContext } from "svelte";
    import { createGameContext, GameContextKey } from "../../stores/game"
    import type { BingoGridContext } from "src/common/BingoGridContext";
    import { createGridContext, GridContextKey } from "../../stores/grid";

    let layoutClass = "wide" // todo

    let isCollapsed = true
    let isShowingIdentityPrompt = false
    let isWidgetShown = true
    let hasModNotifications = false
    let moderationDrawerOpen = false

    const gameContext:Writable<BingoGameContext> = createGameContext()
    setContext(GameContextKey, gameContext)
    const gridContext:Writable<BingoGridContext> = createGridContext()
    setContext(GridContextKey, gridContext)

    let drawingAreaClick = () => {
        if (! isCollapsed)
        {
            isCollapsed = true
        }
        console.log("hehe")
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
        console.log(isCollapsed ? "collapsed" : "not collapsed")
    }
    let onToggleModerationPane = () => {}

    let onSharedIdentityChange = (isShared: boolean) => {
        if (isShared && isShowingIdentityPrompt) {
            isShowingIdentityPrompt = false
        }
        if (!isShared && !isCollapsed) {
            isCollapsed = true
        }
    }

    let onReceiveGame = (game: BingoGame) => {
        console.log("Game received")
    }

    let onRefreshGrid = (grid: BingoGrid) => {
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
<div id="bingoRenderingArea" class={layoutClass}>
    <div id="safeAreaTop" style="grid-column-start: 1; grid-column-end: 4; grid-row: 1; height: '14vh'; width: '100%';" on:click|self={drawingAreaClick}></div>
    <div style="grid-column: 1; grid-row: 2; height: '75vh'" on:click|self={drawingAreaClick}>
        <TabWidget
            shown={isWidgetShown}
            canModerate={$gameContext?.canModerate}
            hasModNotifications={hasModNotifications}
            onToggleGrid={() => onToggleGrid($gameContext)}
            onToggleModerationPane={onToggleModerationPane} />
    </div>
    <div id="bingoGridArea" style="grid-column: 2; grid-row: 2; width: '1fr', margin-left: '2vw'; height: '76vh'; overflow: 'hidden'">
        {#if isShowingIdentityPrompt }
            <div class="identityPrompt">
                    <div style="margin-bottom: '2rem'; margin-top: '1rem'">
                        {$LL.OverlayBingoGrid.IdentityPromptMessage()}
                    </div>
                    <div
                        class="bandeauPrompt bandeauPromptVisible"
                        style="position: 'unset'"
                        on:click={(_) => $gameContext.promptIdentity()}>
                        {$LL.OverlayBingoGrid.ShareIdentityButtonLabel()}
                    </div>
                </div>
        {/if}
        <OverlayBingoGrid
            isCollapsed={isCollapsed}
            
        />
    </div>
    <div style="grid-column: 3; grid-row: 2; width: '7rem', height: '75vh'" on:click={drawingAreaClick}>
    </div>
    <div id="safeAreaBottom" style="grid-column-start: 1; grid-column-end: 4; grid-row: 3; height: '9vh', width: '100%'" on:click={drawingAreaClick}></div>
</div>
{/if}
</BingoGameComponent>