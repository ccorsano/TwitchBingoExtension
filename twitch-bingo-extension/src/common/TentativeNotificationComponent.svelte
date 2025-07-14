<script lang="ts">
    import Button from "@smui/button";
    import type { BingoEntry } from "src/EBS/BingoService/EBSBingoTypes";
    import LL from "src/i18n/i18n-svelte";
    import CountdownCircleTimer from "./CountdownCircleTimer.svelte";

    export let gameId: string
    export let entry: BingoEntry
    export let onExpire: (entry: BingoEntry) => void | undefined
    export let onConfirm: (entry: BingoEntry) => void
    export let referenceTime: Date
    export let confirmationTimeout: number
    export let isConfirmed: boolean

    var duration: number = (referenceTime.getTime() - Date.now()) + confirmationTimeout;
    
    const handleConfirm = () => {
        onConfirm(entry)
        isConfirmed = true
        referenceTime = new Date()
    };

    function renderTime (remainingTime: Date) {
        return `${remainingTime}`;
    }
</script>

<div class:confirmed={isConfirmed} class:pending={!isConfirmed} style:diplay="grid" style:grid-auto-columns="auto 1fr auto" style:padding="0.5rem">
    <div style:gridColumn="1" style:display="inline-grid" style:padding-right="1rem">
        <CountdownCircleTimer
            isPlaying
            key={isConfirmed ? "pre-confirmation" : "post-confirmation" }
            size={40}
            strokeWidth={2}
            colors="#000"
            duration={duration/1000}
            children={renderTime}
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
        />
    </div>
    <div style:grid-column="2" style:display="inline-grid" style:align-self="center">
        {entry.text}
    </div>
    <div style:grid-column="3" style:display="inline-grid">
        <Button aria-label={$LL.BingoModeration.ConfirmButtonLabel()} on:click={handleConfirm} disabled={isConfirmed}>{$LL.BingoModeration.ConfirmButton()}</Button>
    </div>
</div>