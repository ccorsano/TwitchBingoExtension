<script lang="ts">
    import { run, stopPropagation } from 'svelte/legacy';

    import CountdownCircleTimer from '../../common/CountdownCircleTimer.svelte';
    import { BingoEntryState, BingoGridCell } from '../../model/BingoEntry';
    import { FormatTimeout } from '../../EBS/BingoService/EBSBingoTypes';
    import LL from '../../i18n/i18n-svelte';
    import { onMount } from 'svelte';

    interface Props {
        onElementRef: (htmlElement: any) => void;
        cell: BingoGridCell;
        isSelected: boolean;
        onSelect: (key: number) => void;
        onConfirm: (key: number) => void;
    }

    let {
        onElementRef,
        cell,
        isSelected,
        onSelect,
        onConfirm
    }: Props = $props();

    const cellId = Symbol().toString()
    let rootElement:any = $state()

    onMount(() => {
        onElementRef(rootElement)
    })

    let isPrompting = $state(false)
    let isCurrentElementActive:boolean = $state(false)

    run(() => {
        isCurrentElementActive = isSelected && cell.state == BingoEntryState.Idle
        if (! isSelected && isPrompting)
        {
            isPrompting = false
        }
    });

    var bClass = $state("idle")
    run(() => {
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
    });
    
    var showTimer: boolean = $state(false)
    run(() => {
        showTimer = cell.timer != null
    });
    var duration: number = $state(0)
    run(() => {
        duration = showTimer ? (cell.timer!.getTime() - Date.now()) / 1000 : 0
    });
    var classes: string[] = $state()
    var classesStr: string = $state()
    run(() => {
        classes = ["bingoEntry", bClass]
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
        classesStr = classes.join(" ")
    });
    let remainingTime: number = $state(duration)

    const confirmKey = (key: number) => {
        isPrompting = false
        onConfirm(key)
    }

    function onClickConfirm()
    {
        if (isPrompting)
        {
            confirmKey(cell.key)
        }
    }
</script>


<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div id={cellId} bind:this={rootElement}
        class={classesStr}
        onclick={(_) => {
            if (isCurrentElementActive && cell.state == BingoEntryState.Idle)
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
        onclick={stopPropagation(onClickConfirm)} >
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