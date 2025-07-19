<script lang="ts">
import { Icon } from '@smui/button';

import Card, { Actions, Content, PrimaryAction } from '@smui/card';
import IconButton from '@smui/icon-button';
import List from '@smui/list';
import type { BingoEditableEntry } from '../../model/BingoEntry';
import LL from '../../i18n/i18n-svelte';
import EditableBingoEntry from './EditableBingoEntry.svelte'

    interface Props {
        entries: BingoEditableEntry[];
        selectedEntries: number[];
        onAdd: () => void;
        onDeleteEntry: (key: number) => void;
        onChangeEntry: (key: number, changedEntry: BingoEditableEntry) => void;
        onAddToSelection: (selectedEntry: BingoEditableEntry) => void;
        onEntriesUpload: (evt: Event) => void;
    }

    let {
        entries,
        selectedEntries,
        onAdd,
        onDeleteEntry,
        onChangeEntry,
        onAddToSelection,
        onEntriesUpload
    }: Props = $props();

let textInputRef:HTMLInputElement = $state()

let selectedSet = $derived(new Set(selectedEntries));
let selectedFlags = $derived(entries.map((_, i) => selectedSet.has(i)));

function onPaste(evt: ClipboardEvent)
{
    onEntriesUpload(evt)
}

async function onCopy()
{
    let entriesText = entries.map(e => e.text).join('\n')
    await navigator.clipboard.writeText(entriesText)
}

</script>

<svelte:window onpaste={onPaste} />

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
            hidden
            onchange={onEntriesUpload} />
        <IconButton on:click={() => textInputRef.click()} aria-label={$LL.Config.LibraryEditor.UploadButtonLabel()} title={$LL.Config.LibraryEditor.UploadButtonTitle()}>
            <Icon class="material-icons">cloud_upload</Icon>
        </IconButton>
        <IconButton on:click={onCopy} aria-label={$LL.Config.LibraryEditor.CopyEntriesToPasteboardLabel()} title={$LL.Config.LibraryEditor.CopyEntriesToPasteboardTitle()}>
            <Icon class="material-icons">content_copy</Icon>
        </IconButton>
        <IconButton on:click={onAdd} aria-label={$LL.Config.LibraryEditor.AddEntryButtonLabel()} title={$LL.Config.LibraryEditor.AddEntryButtonTitle()}>
            <Icon class="material-icons">library_add</Icon>
        </IconButton>
    </Actions>
    <Content>
        {#if entries.length == 0}
        <em>{$LL.Config.LibraryEditor.MessageNoItems()}</em>
        <IconButton on:click={onAdd} size="mini" color="primary">
            <Icon class="material-icons">library_add</Icon>
        </IconButton>{$LL.Config.LibraryEditor.AddEntryButtonLabel()}
        {:else}
            <List>
                {#each entries as value (value.key)}
                <EditableBingoEntry
                    item={value}
                    selected={selectedFlags[value.key]}
                    onDelete={(_changedEntry) => onDeleteEntry(value.key)}
                    onChange={(changedEntry) => onChangeEntry(value.key, changedEntry)}
                    onSelect={(selectedEntry) => onAddToSelection(selectedEntry)}
                />
                {/each}
            </List>
        {/if}
    </Content>
</Card>