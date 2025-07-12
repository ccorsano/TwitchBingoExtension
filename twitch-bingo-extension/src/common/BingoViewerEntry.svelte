<script lang="ts">
    import { FormatTimeout, type BingoEntry } from "../EBS/BingoService/EBSBingoTypes";
    import { BingoEntryState } from "../model/BingoEntry";
    import { Moon } from 'svelte-loading-spinners'
    import LL from "../i18n/i18n-svelte";
    import Button from "@smui/button";


    export let config: BingoEntry
    export let state: BingoEntryState
    export let isRowCompleted: boolean
    export let isColCompleted: boolean
    export let onTentative: (entry: BingoEntry) => void
    export let countdown: Date | null = null
    export let fontSize: string //TODO
    export let isShown: boolean

    let confirmationPrompt:boolean = false

    // function renderTime(remainingTime)
    // {
    //     return FormatTimeout(remainingTime)
    // }

    function handlePrompt(_:any) {
        if (!isShown)
        {
            return
        }
        if (confirmationPrompt || state == BingoEntryState.Idle)
        {
            confirmationPrompt = ! confirmationPrompt
        }
    }

    function handleTentative(_:any) {
        onTentative(config)
        confirmationPrompt = false
    }

    function isOfType(t: number)
    {
        return config.key % 10 == t;
    }

    let entryVariantType = `type${config.key % 10}`
    let stateClass = confirmationPrompt ? "prompt" : "idle";

    let showTimer = countdown != null
    let duration = 0
    if (showTimer)
    {
        duration = (countdown!.getTime() - Date.now()) / 1000
        showTimer &&= duration > 0
    }
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
            on:click={handlePrompt}
            on:keypress={handlePrompt}>
        <div class={"bingoCellOverlay " + stateClass}></div>
        <div class="bingoEntry">
            <div class="bingoEntryText" >
                {config.text}
            </div>
        </div>
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <!-- svelte-ignore a11y_click_events_have_key_events -->
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
            class="bingoCellPrompt" class:bingoCellPromptVisible={confirmationPrompt} class:bingoCellPromptHidden={!confirmationPrompt}
            on:click={(isShown && confirmationPrompt) ? handleTentative : null} >
            {$LL.BingoViewerEntry.ConfirmButtonLabel()}
        </div>
        {#if showTimer}
            <div class="countdownPrompt bingoCellPrompt bingoCellPromptVisible">
                <div style="font-size: '16px'">
                    <Moon size="70" color="#EA4E7A" duration={`{duration}s`} unit="px"/>
                    <!--
                    /* <CountdownCircleTimer
                        isPlaying
                        size={70}
                        isLinearGradient={true}
                        duration={duration}
                        children={renderTime}
                        strokeWidth={12}
                        trailColor={"#F4A4BB"}
                        colors={"#EA4E7A"}
                    /> */
                    -->
                </div>
            </div>
        {/if}
    </div>
</div>