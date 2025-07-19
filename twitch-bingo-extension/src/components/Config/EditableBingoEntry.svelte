<script lang="ts">
import type { BingoEditableEntry } from '../../model/BingoEntry';
import { Item, Text, PrimaryText, Meta } from '@smui/list';
import LL from '../../i18n/i18n-svelte';
import Textfield  from '@smui/textfield';
import HelperText from '@smui/textfield/helper-text';
import { onMount } from 'svelte';
import IconButton from '@smui/icon-button';

export let item: BingoEditableEntry
export let selected: boolean
export let onDelete: (entry: BingoEditableEntry) => void
export let onChange: (entry: BingoEditableEntry) => void
export let onSelect: (entry: BingoEditableEntry) => void

let isEditing = item.isNew
let value = item.text
let editingValue = item.isNew ? item.text : ""

let editField: Textfield

onMount(() => {
    if (item.isNew)
    {
        editField.focus()
    }
})
function edit()
{
    isEditing = true
    editingValue = value
}

function endEdit()
{
    if (editingValue === "")
    {
        return
    }
    isEditing = false
    value = editingValue
    onChange({
        key: item.key,
        isNew: false,
        text: editingValue
    })
}

function deleteCallback() {
    if (onDelete)
    {
        onDelete(item)
    }
}

function onKeyUp(e: any)
{
    if (e.key == "Enter")
    {
        endEdit()
        e.stopPropagation()
    }
}

function onSelectItem(e: any)
{
    onSelect(item)
}

function onClick() {
    edit()
}

</script>

{#if isEditing}
<Item>
    <IconButton
        on:click={deleteCallback}
        disabled={selected}
        title={selected ? $LL.Config.EditableBingoEntry.DeleteLabelCantRemove() : $LL.Config.EditableBingoEntry.DeleteLabel()}
        sizes="small"
        class="material-icons">delete</IconButton>
    <Textfield
        bind:this={editField}
        label={$LL.Config.EditableBingoEntry.TextFieldLabel()}
        bind:value={editingValue}
        on:keyup={onKeyUp}>
        <HelperText slot="helper">{$LL.Config.EditableBingoEntry.TextFieldPlaceholder()}</HelperText>
    </Textfield>
    <IconButton on:click={endEdit} sizes="small" class="material-icons">check</IconButton>
</Item>
{:else}
<Item button>
    <IconButton
        on:click={deleteCallback}
        disabled={selected}
        title={selected ? $LL.Config.EditableBingoEntry.DeleteLabelCantRemove() : $LL.Config.EditableBingoEntry.DeleteLabel()}
        sizes="small"
        class="material-icons">delete</IconButton>
    <Text
        on:click={onSelectItem}
        on:dblclick={onClick} >
        {value}
    </Text>
    <Meta>
        {#if !selected} 
        <IconButton
            on:click={onSelectItem}
            sizes="small"
            title={$LL.Config.EditableBingoEntry.AddSelectionLabel()}
            class="material-icons">
            playlist_add
        </IconButton>
        {/if}
        <IconButton
            on:click={onClick}
            sizes="small"
            title={$LL.Config.EditableBingoEntry.EditLabel()}
            class="material-icons">
            edit
        </IconButton>
    </Meta>
</Item>
{/if}