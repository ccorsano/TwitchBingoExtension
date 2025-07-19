<script lang="ts">
    import { run } from 'svelte/legacy';

    import type { BingoGridCell } from "../../model/BingoEntry";
    import BingoMobileEntry from "./BingoMobileEntry.svelte";

    interface Props {
        entries?: BingoGridCell[];
        selectedKey?: number | null;
        onSelectKey: (key: number) => void;
        onTentative: (key: number) => void;
    }

    let {
        entries = new Array(0),
        selectedKey = null,
        onSelectKey,
        onTentative
    }: Props = $props();

    const entriesRefs:Map<number, any> = new Map<number, any>()
    
    run(() => {
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
    });
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