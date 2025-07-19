<script lang="ts">
    import Paper, { Content, Title } from '@smui/paper'
    
    interface Props {
        severity: string;
        title?: import('svelte').Snippet;
        body?: import('svelte').Snippet;
    }

    let { severity, title, body }: Props = $props();
</script>

<Paper class={"alert alert-" + severity}>
    <Title class={"alert__title"}>
        {@render title?.()}
    </Title>
    <Content class={"alert__content"}>
        {@render body?.()}
    </Content>
</Paper>

<style>
    :global(.alert)
    {
        padding-top: 0.5em;
        padding-bottom: 0.5em;
    }

    :global(.alert__title)
    {
        padding-top: 0;
        padding-bottom: 0;
        font-size: small !important;
        padding: 0 !important;
    }

    :global(.alert__content)
    {
        font-size: small !important;
        padding: 0 !important;
    }

    :global(.alert-error)
    {
        color: rgb(97, 26, 21) !important;
        background-color: rgb(253, 236, 234) !important;
    }
    
    :global(.alert-warning)
    {
        color: rgb(102, 60, 0) !important;
        background-color: rgb(255, 244, 229) !important;
    }
    
    :global(.alert-info)
    {
        color: rgb(0, 60, 102) !important;
        background-color: rgb(229, 244, 255) !important;
    }
</style>