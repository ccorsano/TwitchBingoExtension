<script lang="ts">
    import Paper from '@smui/paper'
    
    export let severity: string
</script>

<Paper>
    <slot name="title"></slot>
    <slot name="body"></slot>
</Paper>