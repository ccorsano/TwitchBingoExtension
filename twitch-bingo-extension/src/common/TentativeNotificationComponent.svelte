<script lang="ts">
    import Button from "@smui/button";
    import type { BingoEntry } from "../EBS/BingoService/EBSBingoTypes";
    import LL from "../i18n/i18n-svelte";
    import CountdownCircleTimer from "./CountdownCircleTimer.svelte";

    export let entry: BingoEntry
    export let onExpire: (entry: BingoEntry) => void | undefined
    export let onConfirm: (entry: BingoEntry) => void
    export let referenceTime: Date
    export let confirmationTimeout: number
    export let isConfirmed: boolean

    var remainingTime: number = confirmationTimeout / 1000
    
    const handleConfirm = () => {
        onConfirm(entry)
        isConfirmed = true
        referenceTime = new Date()
    };
</script>

<div class:confirmed={isConfirmed} class:pending={!isConfirmed} style:display="grid" style:grid-auto-columns="40px 1fr auto" style:padding="0.5rem">
    <div style:grid-column="1" style:display="inline-grid">
        <CountdownCircleTimer
            isPlaying
            size={40}
            strokeWidth={2}
            colors="#000"
            duration={(confirmationTimeout ?? 0.0)/1000}
            onUpdate={ (remaining) => {
                remainingTime = Math.ceil((confirmationTimeout / 1000.0) - remaining)
            }}
            onComplete={ (_elapsed) => {
                if (! isConfirmed)
                {
                    if (onExpire) onExpire(entry)
                }
                else
                {
                    if (onExpire) onExpire(entry)
                }
            }}
        >
            <span>{ remainingTime }</span>
        </CountdownCircleTimer>
    </div>
    <div style:grid-column="2" style:display="inline-grid" style:padding-left="0.5rem" style:align-self="center" style:text-wrap="nowrap" style:overflow="hidden">
        {entry.text}
    </div>
    <div style:grid-column="3" style:display="inline-grid">
        <Button aria-label={$LL.BingoModeration.ConfirmButtonLabel()} on:click={handleConfirm} disabled={isConfirmed}>{$LL.BingoModeration.ConfirmButton()}</Button>
    </div>
</div>