<script lang="ts">
    import LL from '../../i18n/i18n-svelte';
    import { Icon } from "@smui/button";
    import Card, { Content } from "@smui/card";
    import type { BingoEditableEntry } from "src/model/BingoEntry";
    import List, { Item, Text, Meta } from '@smui/list';
    import IconButton from '@smui/icon-button';

    interface Props {
        entries: BingoEditableEntry[];
        selectedEntries: number[];
        onRemoveFromSelection: (entry: BingoEditableEntry) => void;
    }

    let { entries, selectedEntries, onRemoveFromSelection }: Props = $props();

    function onRemoveFromSelectionKey(key: number) {
        const entry = getEntry(key)
        if (entry != null)
        {
            onRemoveFromSelection(entry)
        }
    }

    function getEntry(key: number){
        return entries.find(b => b.key == key)
    }
</script>

<Card>
    <Content>
        <h2 class="mdc-typography--headline6">{$LL.Config.EntrySelectionView.Title()}</h2>
        <h3 class="mdc-typography--subtitle2" style="margin: 0 0 10px; color: #888;">
            {$LL.Config.EntrySelectionView.TitleSubHeader()}
        </h3>
        {#if selectedEntries.length == 0}
        <span><em>{$LL.Config.EntrySelectionView.NoItemMessage()}</em></span>
        {:else}
        <List>
            {#each selectedEntries as key, index (key)}
                <Item on:click={() => onRemoveFromSelectionKey(key)}>
                    <Text>{`${index+1}) ${getEntry(key)?.text}`}</Text>
                    <Meta>
                        <IconButton on:click={() => onRemoveFromSelectionKey(key)} sizes="small">
                            <Icon class="material-icons">do_not_disturb_on</Icon>
                        </IconButton>
                    </Meta>
                </Item>
            {/each}
        </List>
        {/if}
    </Content>
</Card>
