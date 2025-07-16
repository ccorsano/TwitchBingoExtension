<script lang="ts">
import { onMount, onDestroy } from "svelte"
import type { BingoEntry, BingoGame, BingoLogEntry } from "../../EBS/BingoService/EBSBingoTypes"
import { FormatTimespan } from "../../EBS/BingoService/EBSBingoTypes"
import { BingoEditableEntry } from "../../model/BingoEntry";
import type { TwitchExtensionConfiguration } from "../../common/TwitchExtension"
import { TwitchExtHelper, TwitchExtQuery } from "../../common/TwitchExtension"
import { BingoEBS } from "../../EBS/BingoService/EBSBingoService";
import { Twitch } from "../../services/TwitchService";
import { BingoBroadcastEventType } from "../../model/BingoConfiguration"
import type { BingoConfiguration } from "../../model/BingoConfiguration"
import { EBSVersion } from "../../EBS/EBSConfig";
import LibraryEditor from "./LibraryEditor.svelte";

import StatusCard from "./StatusCard.svelte"
import EntrySelectionView from "./EntrySelectionView.svelte";
import GridConfigurationView from "./GridConfigurationView.svelte";

let nextKey: number = 0
let columns: number = 3
let rows: number = 3
let entries: BingoEditableEntry[] = new Array(0)
let selectedEntries: number[] = new Array(0)
let confirmationThresholdSeconds: number = 120
let activeGame: BingoGame | null = null
let isStarting: boolean = false
let isLoading: boolean = true
let canEnableChat: boolean = false
let isLoadingLog: boolean = false
let logEntries: BingoLogEntry[] = new Array(0)

function isSelected(entry: BingoEntry): boolean
{
    return selectedEntries.some(b => b == entry.key)
}

function loadConfig(broadcasterConfig: TwitchExtensionConfiguration)
{
    if (! broadcasterConfig?.content)
    {
        isLoading = false
        return
    }
    TwitchExtHelper.rig.log(broadcasterConfig.content);
    var configContent = JSON.parse(broadcasterConfig.content);

    nextKey = configContent?.nextKey ?? 0
    entries = configContent?.entries ?? new Array(0)
    selectedEntries = configContent?.selectedEntries ?? new Array(0)
    rows = configContent?.rows ?? 3
    columns = configContent?.columns ?? 3
    confirmationThresholdSeconds = configContent?.confirmationThreshold ?? 120
    canEnableChat = TwitchExtHelper.features.isChatEnabled

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
let whisperChannel: string
$: whisperChannel = 'whisper-' + TwitchExtHelper.viewer.opaqueId

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
})

onDestroy(() => {
    Twitch.unlisten('broadcast', onReceiveUpdate)
    Twitch.unlisten(whisperChannel, onReceiveUpdate)

    if (TwitchExtQuery.state == "testing")
    {
        clearInterval(timer)
    }
})

function onAdd(): void
{
    var newEntry = new BingoEditableEntry(nextKey, "", true)
    nextKey = nextKey + 1
    entries = entries.concat([newEntry])
}
function onSave(): void
{
    const config: BingoConfiguration = {
        nextKey: nextKey,
        entries: entries,
        selectedEntries: selectedEntries,
        rows: rows,
        columns: columns,
        confirmationThreshold: confirmationThresholdSeconds,
        activeGameId: activeGame?.gameId,
    }
    const serializedConfig = JSON.stringify(config);
    TwitchExtHelper.configuration.set('broadcaster', EBSVersion, serializedConfig);
    TwitchExtHelper.rig.log(serializedConfig);
    TwitchExtHelper.send('broadcast','application/json', {
        type: BingoBroadcastEventType.SetConfig,
        payload: config
    });
}

function onAddToSelection(entry: BingoEditableEntry): void
{
    console.log('Adding to selection')
    if (! isSelected(entry))
    {
        selectedEntries = selectedEntries.concat(entry.key)
    }
}

function onRemoveFromSelection(entry: BingoEditableEntry): void
{
    if (entry && isSelected(entry))
    {
        var newEntries = selectedEntries.filter(key => key !== entry.key);
        selectedEntries = newEntries
    }
}

function onStart(): void
{
    onSave()
    isStarting = true
    BingoEBS.createGame({
        rows: rows,
        columns: columns,
        entries: selectedEntries.map<BingoEntry>((entryKey: number, index: number) => {
            let entry:BingoEntry | undefined = entries.find(b => b.key == entryKey);
            if (entry === undefined)
            {
                throw "Missing entry with key " + entryKey;
            }
            return {
                key: index + 1,
                text: entry.text,
            };
        }),
        confirmationThreshold: FormatTimespan(confirmationThresholdSeconds),
        enableChatIntegration: TwitchExtHelper.features.isChatEnabled,
    }).then((game)=> {
        console.log("Started game " + game.gameId);

        activeGame = game
        
        const config: BingoConfiguration = {
            nextKey: nextKey,
            entries: entries,
            selectedEntries: selectedEntries,
            rows: rows,
            columns: columns,
            confirmationThreshold: confirmationThresholdSeconds,
            activeGameId: game.gameId,
        }
        var configUpdateJson = JSON.stringify(config)
        TwitchExtHelper.configuration.set('broadcaster', EBSVersion, configUpdateJson);
        TwitchExtHelper.send('broadcast','application/json', {
            type: BingoBroadcastEventType.Start,
            payload: game
        });
    }).finally(() => {
        isStarting = false
    });
}

function onStop(): void
{
    if (! activeGame)
    {
        return;
    }
    BingoEBS.stopGame(activeGame.gameId).finally(() => {
        TwitchExtHelper.send('broadcast','application/json', {
            type: BingoBroadcastEventType.Stop,
            payload: activeGame
        })
        activeGame = null
    })
}

function onChangeEntry(key: number, entry: BingoEditableEntry): void
{
    var index = entries.findIndex((entry) => { return entry.key == key; });
    if (index == -1){
        console.error("Could not find changed key " + key);
        return;
    }
    entries[index] = entry;
    entries = entries
}

function onDeleteEntry(key: number): void
{
    var index = entries.findIndex((entry) => { return entry.key == key; });
    if (index == -1){
        console.error("Could not find key " + key + " to delete");
        return;
    }
    entries.splice(index, 1);
    entries = entries
    selectedEntries = selectedEntries.filter(s => s != key)
}

function onEntriesUpload(evt: Event): void
{
    const target = evt.target as HTMLInputElement;
    var file = target.files![0];
    var reader = new FileReader();
    reader.onload = (ev: ProgressEvent<FileReader>) => {
        var content = ev.target!.result as string;

        var entries:BingoEditableEntry[] = new Array(0);

        content.split('\n').forEach((line, index) => {
            if(! line) return;

            var newEntry = new BingoEditableEntry(index, line, false)
            entries.push(newEntry);
        });
        selectedEntries = new Array(0)
        nextKey = entries.length + 1
        entries = entries
    };
    reader.readAsText(file);
}

</script>

<StatusCard
    isActive={activeGame != null}
    isLoading={isLoading}
    onStop={onStop}
    isLoadingLog={isLoadingLog}
    entries={activeGame?.entries}
    logEntries={logEntries}
    onRefreshLog={() => refreshLog(activeGame)} />
{#if activeGame == null && !isLoading }
    <LibraryEditor
        entries={entries}
        selectedEntries={selectedEntries}
        onAdd={onAdd}
        onChangeEntry={onChangeEntry}
        onDeleteEntry={onDeleteEntry}
        onAddToSelection={onAddToSelection}
        onEntriesUpload={onEntriesUpload}
    />
    <EntrySelectionView
        entries={entries}
        selectedEntries={selectedEntries}
        onAddToSelection={onAddToSelection}
        onRemoveFromSelection={onRemoveFromSelection}
    />
    <GridConfigurationView
        columns={columns}
        rows={rows}
        confirmationThresholdSeconds={confirmationThresholdSeconds}
        selectedEntriesLength={selectedEntries.length}
        onColumnsChange={(c) => columns = c}
        onRowsChange={(r) => rows = r}
        onConfirmationTimeoutChange={(timeout) => confirmationThresholdSeconds = timeout}
        onSave={onSave}
        onStart={onStart}
        isStarting={isStarting}
        canEnableChat={canEnableChat}
    />
{/if}