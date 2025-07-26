<script lang="ts">
import BingoLogo from "../../../assets/BingoLogo.svg"

export let shown:boolean
export let canModerate:boolean
export let hasModNotifications:boolean
export let moderationShown:boolean
export let onToggleGrid: () => void
</script>

<style lang="scss">
    @use "./TabWidget.scss"
</style>

<div class="tabWidgetContainer">
    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class:shown={shown} class:hidden={!shown} class="tabWidget" on:click|capture={_ => onToggleGrid()}>
        <img src={BingoLogo} alt="Bingo Logo" />
    </div>
    {#if canModerate}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class:shown={shown || moderationShown}
             class:hidden={!shown && !moderationShown}
             class:pending={hasModNotifications}
             class="tabWidget"
             on:click|capture={_ => moderationShown = !moderationShown }>
            <span>⚔</span>
        </div>
    {/if}
</div>