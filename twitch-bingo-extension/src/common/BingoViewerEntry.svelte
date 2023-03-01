<script lang="ts">
    import { FormatTimeout, type BingoEntry } from "src/EBS/BingoService/EBSBingoTypes";
    import { BingoEntryState } from "src/model/BingoEntry";
    import LL from "src/i18n/i18n-svelte";


    export let config: BingoEntry
    export let state: BingoEntryState
    export let canInteract: boolean
    export let canConfirm: boolean
    export let isRowCompleted: boolean
    export let isColCompleted: boolean
    export let onTentative: (entry: BingoEntry) => void
    export let countdown: Date
    export let fontSize: string
    export let isShown: boolean

    let confirmationPrompt:boolean = false

    function renderTime(remainingTime)
    {
        return FormatTimeout(remainingTime)
    }

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

    let entryVariantType = `type${config.key % 10}`
    let stateClass = confirmationPrompt ? "prompt" : "idle";

</script>

<style lang="scss">
    @import "./BingoViewerEntry.scss"
</style>

<div class={"entryGridCell " + entryVariantType}>
    <div    class={"bingoCell paper " + stateClass}
            class:visibleCell={isShown}
            class:hiddenCell={!isShown}
            class:colConfirmed={isColCompleted}
            class:rowConfirmed={isRowCompleted}
            on:click={handlePrompt}>
        <div class={"bingoCellOverlay " + stateClass}></div>
        <div class="bingoEntry">
            <div class="bingoEntryText" >
                {config.text}
            </div>
        </div>
        <div
            class="bingoCellPrompt" class:bingoCellPromptVisible={confirmationPrompt} class:bingoCellPromptHidden={!confirmationPrompt}
            on:click={(isShown && confirmationPrompt) ? handleTentative : null} >
            {LL.BingoViewerEntry.ConfirmButtonLabel()}
        </div>
        /* { timerComponent } */
    </div>
</div>