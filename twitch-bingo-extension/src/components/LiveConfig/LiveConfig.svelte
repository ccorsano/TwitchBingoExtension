<script lang="ts">
    import { onMount } from "svelte"
    import type { BingoGame, BingoLogEntry } from "../../EBS/BingoService/EBSBingoTypes"
    import type { TwitchExtensionConfiguration } from "../../common/TwitchExtension"
    import { TwitchExtHelper, TwitchExtQuery } from "../../common/TwitchExtension"
    import { BingoEBS } from "../../EBS/BingoService/EBSBingoService";
    import { Twitch } from "../../services/TwitchService";

    import StatusCard from "../Config/StatusCard.svelte"

    let activeGame: BingoGame | null = $state(null)
    let isLoading: boolean = $state(true)
    let isLoadingLog: boolean = $state(false)
    let logEntries: BingoLogEntry[] = $state(new Array(0))

    function loadConfig(broadcasterConfig: TwitchExtensionConfiguration)
    {
        if (! broadcasterConfig?.content)
        {
            isLoading = false
            return
        }
        TwitchExtHelper.rig.log(broadcasterConfig.content);
        var configContent = JSON.parse(broadcasterConfig.content);

        let activeGameId: string = configContent.activeGameId ?? configContent.activeGame?.gameId
        if (activeGame?.gameId !== activeGameId)
        {
            BingoEBS.getGame(activeGameId)
                .then(game => {
                    activeGame = game
                })
                .catch(error => {
                    console.log(`Error fetching game ${activeGameId}: ${error}`)
                })
                .finally(() => {
                    isLoading = false
                })
        }
        else
        {
            isLoading = false
        }
    }

    function refreshLog(game: BingoGame | null)
    {
        if (game != null)
        {
            isLoadingLog = true
            BingoEBS.getGameLog(game.gameId)
                .then(logs => {
                    logEntries = logs
                })
                .finally(() => {
                    isLoadingLog = false
                })
        }
    }

    function onReceiveUpdate()
    {
        refreshLog(activeGame!)
    }

    // Setup gameLog refresh whenever a message is received, either broadcast or whisper
    let whisperChannel: string = $derived('whisper-' + TwitchExtHelper.viewer.opaqueId)
    

    let timer: NodeJS.Timeout
    onMount(() => {
        Twitch.onConfiguration.push(loadConfig)
        // Initial refresh when game updates
        refreshLog(activeGame!)
        Twitch.listen('broadcast', onReceiveUpdate)
        Twitch.listen(whisperChannel, onReceiveUpdate)

        if (TwitchExtQuery.state == "testing")
        {
            console.log("Registering test polling for logs, activeGame " + activeGame)
            timer = setInterval(() => 
            {
                refreshLog(activeGame!)
            }, 1000)
        }

        return () => {
            Twitch.unlisten('broadcast', onReceiveUpdate)
            Twitch.unlisten(whisperChannel, onReceiveUpdate)

            if (TwitchExtQuery.state == "testing")
            {
                clearInterval(timer)
            }
        }
    })

</script>

<style lang="scss">
    @use "./LiveConfig.scss";
    @use "../../common/BingoTheme.scss";
    @use "../../common/BingoStyles.scss";
</style>

<StatusCard
    isActive={activeGame != null}
    isLoading={isLoading}
    isLoadingLog={isLoadingLog}
    entries={activeGame?.entries}
    logEntries={logEntries}
    onRefreshLog={() => refreshLog(activeGame)} />