<script lang="ts">
    import CountdownCircleTimer from '../../common/CountdownCircleTimer.svelte';
    import { BingoEntryState, BingoGridCell } from '../../model/BingoEntry';
    import { FormatTimeout } from '../../EBS/BingoService/EBSBingoTypes';
    import LL from '../../i18n/i18n-svelte';
    import { onMount } from 'svelte';

    export let onElementRef: (htmlElement: any) => void
    export let cell: BingoGridCell
    export let isSelected: boolean
    export let onSelect: (key: number) => void
    export let onConfirm: (key: number) => void

    const cellId = Symbol().toString()
    let rootElement:any

    onMount(() => {
        onElementRef(rootElement)
    })

    let isPrompting = false
    const isCurrentElementActive = isSelected && cell.state == BingoEntryState.Idle

    $:{
        if (! isSelected && isPrompting)
        {
            isPrompting = false
        }
    }

    var bClass = "idle"
    $:{
        switch (cell.state) {
            case BingoEntryState.Pending:
                bClass = "pending"
                break;
            case BingoEntryState.Confirmed:
                bClass = "confirmed"
                break;
            case BingoEntryState.Missed:
                bClass = "missed"
                break;
            case BingoEntryState.Rejected:
                bClass = "rejected"
                break;
            default:
                break;
        }
    }
    
    var showTimer: boolean = false
    $: showTimer = cell.timer != null
    var duration: number = 0
    $: showTimer ? (cell.timer!.getTime() - Date.now()) / 1000 : 0
    var classes: string[] = ["bingoEntry", bClass]
    $:{
        if (isSelected)
        {
            if (isPrompting)
            {
                classes.push("prompting")
            }
            else
            {
                classes.push("highlighted")
            }
            classes.push("prompt")
        }
    }
    let remainingTime: number = duration

    const confirmKey = (key: number) => {
        isPrompting = false
        onConfirm(key)
    }
</script>


<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div id={cellId} bind:this={rootElement}
        class={classes.join(" ")}
        on:click|capture={(_) => {
            if (isCurrentElementActive)
            {
                isPrompting = !isPrompting
            } else {
                onSelect(cell.key)
            }
        }}
        style:position="relative">
    <div class='key'>{cell.key}</div>
    <div class='text'>
        {cell.text}
    </div>
    <div
        class={"bingoCellPrompt"}
        class:bingoCellPromptVisible={isCurrentElementActive && isPrompting}
        class:bingoCellPromptHidden={!(isCurrentElementActive && isPrompting)}
        on:click|capture={ isPrompting ? (_) => confirmKey(cell.key) : null} >
        {$LL.Mobile.ConfirmButton()}
    </div>
    <div class={"bingoCellTimer"}
         class:bingoCellTimerVisible={showTimer && duration > 0}
         class:bingoCellTimerHidden={!(showTimer && duration > 0)}>
        <div style:display="inline-block">
            {#if showTimer && duration > 0}
                <CountdownCircleTimer
                    isPlaying
                    size={50}
                    strokeWidth={3}
                    colors="#000"
                    duration={duration}
                    onUpdate={elapsedTime => {
                        remainingTime = duration - elapsedTime
                    }}
                >
                    <span style:font-size="14px">
                        {FormatTimeout(remainingTime)}
                    </span>
                </CountdownCircleTimer>
            {/if}
        </div>
    </div>
</div>