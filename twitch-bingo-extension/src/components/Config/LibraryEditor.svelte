<script lang="ts">
import Button, { Icon } from '@smui/button';

import Card, { Content } from '@smui/card';
import Actions from '@smui/card/src/Actions.svelte';
import PrimaryAction from '@smui/card/src/PrimaryAction.svelte';
import IconButton from '@smui/icon-button';
import List from '@smui/list';
import type { BingoEditableEntry } from '../../model/BingoEntry';
import LL from '../../i18n/i18n-svelte';
import EditableBingoEntry from './EditableBingoEntry.svelte'
import type { BingoEntry } from '../../EBS/BingoService/EBSBingoTypes';

export let entries: BingoEditableEntry[]
export let selectedEntries: number[]
export let onAdd: () => void
export let onDeleteEntry: (key: number) => void
export let onChangeEntry: (key: number, changedEntry: BingoEditableEntry) => void
export let onAddToSelection: (selectedEntry: BingoEditableEntry) => void
export let onEntriesUpload: (evt: any) => void

let textInputRef:HTMLInputElement

function isSelected(entry: BingoEntry): boolean{
    return selectedEntries.some(b => b == entry.key)
}

console.log("LibraryEditor")
</script>

<Card>
    <PrimaryAction>
        <Content>
            <h2 class="mdc-typography--headline6" style="margin: 0;">
                {$LL.Config.StatusCard.Title()}
            </h2>
            <h3 class="mdc-typography--subtitle2" style="margin: 0 0 10px; color: #888;">
                {$LL.Config.LibraryEditor.TitleSubHeader()}
            </h3>
        </Content>
    </PrimaryAction>
    <Actions>
        <input
            bind:this={textInputRef}
            type="file"
            style="display: 'none'"
            onChange={onEntriesUpload} />
        <IconButton on:click={(_) => textInputRef.click()} aria-label={$LL.Config.LibraryEditor.UploadButtonLabel()} title={$LL.Config.LibraryEditor.UploadButtonTitle()}>
            <Icon class="material-icons">cloud_upload</Icon>
        </IconButton>
        <IconButton on:click={onAdd} aria-label={$LL.Config.LibraryEditor.AddEntryButtonLabel()} title={$LL.Config.LibraryEditor.AddEntryButtonTitle()}>
            <Icon class="material-icons">library_add</Icon>
        </IconButton>
    </Actions>
    <Content>
        {#if entries.length == 0}
        <em>{$LL.Config.LibraryEditor.MessageNoItems()}</em>
        <Button variant="outlined" color="primary" onClick={onAdd} sizes="small" startIcon="library_add">
            {$LL.Config.LibraryEditor.AddEntryButtonLabel()}
        </Button>
        {:else}
            <List>
                {#each entries as value (value.key)}
                <EditableBingoEntry
                    item={value}
                    selected={isSelected(value)}
                    onDelete={(_changedEntry) => onDeleteEntry(value.key)}
                    onChange={(changedEntry) => onChangeEntry(value.key, changedEntry)}
                    onSelect={(selectedEntry) => onAddToSelection(selectedEntry)}
                />
                {/each}
            </List>
        {/if}
    </Content>
</Card>