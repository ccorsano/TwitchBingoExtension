<script lang="ts">
    import { run, stopPropagation } from 'svelte/legacy';

    import { FormatTimeout, type BingoEntry, type BingoTentative } from "../EBS/BingoService/EBSBingoTypes";
    import { BingoEntryState } from "../model/BingoEntry";
    import LL from "../i18n/i18n-svelte";
    import CountdownCircleTimer from "./CountdownCircleTimer.svelte";


    interface Props {
        config: BingoEntry;
        state: BingoEntryState;
        isRowCompleted: boolean;
        isColCompleted: boolean;
        onTentative: (entry: BingoEntry) => Promise<BingoTentative>;
        countdown?: Date | null;
        isShown: boolean;
    }

    let {
        config,
        state,
        isRowCompleted,
        isColCompleted,
        onTentative,
        countdown = $bindable(null),
        isShown
    }: Props = $props();

    let confirmationPrompt:boolean = $state(false)
    let tentative: Promise<BingoTentative> | null = null

    function handlePrompt(_:any) {
        if (!isShown)
        {
            return
        }
        if (confirmationPrompt || state == BingoEntryState.Idle)
        {
            confirmationPrompt = !confirmationPrompt
        }
    }

    function handleTentative(_:any) {
        confirmationPrompt = false
        if (! tentative)
        {
            tentative = onTentative(config)
            tentative
            .catch((error) => console.error(`Error on tentative: ${error}`))
            .finally(() => {
                tentative = null
            })
        }
    }

    function isOfType(t: number)
    {
        return config.key % 10 == t;
    }

    let stateClass = $state("idle")

    run(() => {
        if (confirmationPrompt)
        {
            stateClass = "prompt"
        }
        switch(state)
        {
            case BingoEntryState.Confirmed:
                stateClass = "grid-confirmed";
                countdown = null;
                break;
            case BingoEntryState.Missed:
                stateClass = "grid-missed";
                countdown = null;
                break;
            case BingoEntryState.Pending:
                stateClass = "grid-pending";
                break;
            case BingoEntryState.Rejected:
                stateClass = "grid-rejected";
                countdown = null;
                break;
            default:
                break;
        }
    });

    let showTimer:boolean = $state(false)
    run(() => {
        showTimer = countdown != null
    });
    let duration = $state(0)
    let remainingTime = $state(0)
    run(() => {
        if (showTimer)
        {
            duration = (countdown!.getTime() - Date.now()) / 1000
            showTimer &&= duration > 0
        }
    });
</script>

<style lang="scss">
    @use "./BingoViewerEntry.scss";
    @use "../common/BingoTheme.scss";
</style>

<div class={`entryGridCell`}
    class:type0={isOfType(0)}
    class:type1={isOfType(1)}
    class:type2={isOfType(2)}
    class:type3={isOfType(3)}
    class:type4={isOfType(4)}
    class:type5={isOfType(5)}
    class:type6={isOfType(6)}
    class:type7={isOfType(7)}
    class:type8={isOfType(8)}
    class:type9={isOfType(9)}>
    <div class={"bingoCell paper " + stateClass} role="button" tabindex="0"
            class:visibleCell={isShown}
            class:hiddenCell={!isShown}
            class:colConfirmed={isColCompleted}
            class:rowConfirmed={isRowCompleted}
            onclick={handlePrompt}
            onkeypress={handlePrompt}>
        <div class={"bingoCellOverlay " + stateClass}></div>
        <div class="bingoEntry">
            <div class="bingoEntryText" >
                {config.text}
            </div>
        </div>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div
            class="bingoCellPrompt" class:bingoCellPromptVisible={confirmationPrompt} class:bingoCellPromptHidden={!confirmationPrompt}
            onclick={stopPropagation((isShown && confirmationPrompt) ? handleTentative : null)} >
            {$LL.BingoViewerEntry.ConfirmButtonLabel()}
        </div>
        {#if showTimer}
            <div class="countdownPrompt bingoCellPrompt bingoCellPromptVisible">
                <div style:font-size="16px">
                    <CountdownCircleTimer
                        isPlaying
                        size={70}
                        duration={duration}
                        strokeWidth={12}
                        trailColor={"#F4A4BB"}
                        colors={"#EA4E7A"}
                        onUpdate={ elapsedTime => {
                            remainingTime = Math.ceil(duration - elapsedTime)
                        }}
                    >
                        <span class="countdownText">
                            { FormatTimeout(remainingTime) }
                        </span>
                    </CountdownCircleTimer>
                </div>
            </div>
        {/if}
    </div>
</div>