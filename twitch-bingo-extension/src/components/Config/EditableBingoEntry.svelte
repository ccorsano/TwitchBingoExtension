<script type="ts">
import type { BingoEditableEntry } from '../../model/BingoEntry';
import { Item, Text, PrimaryText } from '@smui/list';
import IconButton, { Icon } from '@smui/icon-button';
import LL from '../../i18n/i18n-svelte';
import Textfield  from '@smui/textfield';
import HelperText from '@smui/textfield/helper-text';
import type { TextfieldComponentDev } from  '@smui/textfield';
import { onMount } from 'svelte';

export let item: BingoEditableEntry
export let selected: boolean
export let onDelete: (entry: BingoEditableEntry) => void
export let onChange: (entry: BingoEditableEntry) => void
export let onSelect: (entry: BingoEditableEntry) => void

let isEditing = item.isNew
let value = item.text
let editingValue = item.isNew ? item.text : ""

let editField: TextfieldComponentDev

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
    console.log(editingValue)
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

function onClick(e: any) {
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
        class="material-icons">delete
    </IconButton>
    <Text
        on:click={onSelectItem}
        on:dblclick={onClick} >
        <PrimaryText>{value}</PrimaryText>
    </Text>
    {#if selected} 
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
</Item>
{/if}