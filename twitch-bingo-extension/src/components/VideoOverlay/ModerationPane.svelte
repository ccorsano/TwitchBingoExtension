<script lang="ts">
    import Drawer, { Content, Header } from "@smui/drawer"
    import IconButton from "@smui/icon-button";

    export let open:boolean = false;

    function onClose()
    {
        open = false;
    }
</script>

<Drawer variant="dismissible" bind:open>
    <Header>
        <IconButton on:click={onClose}>
            
        </IconButton>
    </Header>
    <Content>
        
    </Content>
</Drawer>