<script lang="ts">
    import { onMount } from "svelte";
    import type { BingoGridCell } from "../../model/BingoEntry";
    import BingoMobileEntry from "./BingoMobileEntry.svelte";

    export let entries: BingoGridCell[] = new Array(0)
    export let selectedKey: number | null = null
    export let onSelectKey: (key: number) => void
    export let onTentative: (key: number) => void

    const entriesRefs:Map<number, any> = new Map<number, any>()
    
    $:{
        if (selectedKey && entriesRefs.has(selectedKey))
        {
            let entryElement = entriesRefs.get(selectedKey)
            if (typeof entryElement['scrollIntoViewIfNeeded'] === 'function')
            {
                entryElement.scrollIntoViewIfNeeded()
            } else {
                entryElement.scrollIntoView()
            }
        }
    }
</script>

<style lang="scss">
    @use "./BingoMobileEntryList.scss"
</style>


<div id="entry-list">
    {#each entries as cell}
        <BingoMobileEntry
            onElementRef={item => entriesRefs.set(cell.key, item)}
            cell={cell}
            isSelected={selectedKey == cell.key}
            onSelect={onSelectKey}
            onConfirm={onTentative} />
    {/each}
</div>