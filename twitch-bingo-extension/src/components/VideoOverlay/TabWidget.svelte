<script lang="ts">
import BingoLogo from "../../../assets/BingoLogo.svg"

    interface Props {
        shown: boolean;
        canModerate: boolean;
        hasModNotifications: boolean;
        moderationShown: boolean;
        onToggleGrid: () => void;
    }

    let {
        shown,
        canModerate,
        hasModNotifications,
        moderationShown = $bindable(),
        onToggleGrid
    }: Props = $props();
</script>

<style lang="scss">
    @use "./TabWidget.scss"
</style>

<div class="tabWidgetContainer">
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class:shown={shown} class:hidden={!shown} class="tabWidget" onclickcapture={_ => onToggleGrid()}>
        <img src={BingoLogo} alt="Bingo Logo" />
    </div>
    {#if canModerate}
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class:shown={shown || moderationShown}
             class:hidden={!shown && !moderationShown}
             class:pending={hasModNotifications}
             class="tabWidget"
             onclickcapture={_ => moderationShown = !moderationShown}>
            <span>⚔</span>
        </div>
    {/if}
</div>