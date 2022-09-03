<script lang="ts">
    import Mobile from './components/Mobile/Mobile.svelte'
    import { GetCurrentLanguage } from './common/ExtensionUtils'
    import { setLocale } from './i18n/i18n-svelte'
    import { onMount } from "svelte";
    import { loadLocaleAsync } from "./i18n/i18n-util.async";
    import LL from "./i18n/i18n-svelte"

    onMount(async () => {
        const currentLocale = GetCurrentLanguage()
        await loadLocaleAsync(currentLocale)
        setLocale(currentLocale)
        console.log($LL.startup())
    })
</script>

<Mobile />