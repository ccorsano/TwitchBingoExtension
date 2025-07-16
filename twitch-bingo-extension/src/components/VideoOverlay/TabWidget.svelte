<script lang="ts">
import BingoLogo from "../../../assets/BingoLogo.svg"

export let shown:boolean
export let canModerate:boolean
export let hasModNotifications:boolean
export let moderationShown:boolean
export let onToggleGrid: () => void
export let onToggleModerationPane: () => void
</script>

<style lang="scss">
    @import "./TabWidget.scss"
</style>

<div class="tabWidgetContainer">
    <div class:shown={shown} class:hidden={!shown} class="tabWidget" on:click|capture={_ => onToggleGrid()}>
        <img src={BingoLogo} alt="Bingo Logo" />
    </div>
    {#if canModerate}
        <div class:shown class:hidden={!shown} class:pending={hasModNotifications} class="tabWidget" on:click|capture={_ => moderationShown = !moderationShown }>
            <span>⚔</span>
        </div>
    {/if}
</div>