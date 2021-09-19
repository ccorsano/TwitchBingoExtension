import * as React from 'react';
import { TwitchExtensionConfiguration, TwitchExtHelper, TwitchExtQuery } from '../../common/TwitchExtension';
import { BingoEBS } from '../../EBS/BingoService/EBSBingoService';
import * as EBSBingo from '../../EBS/BingoService/EBSBingoTypes';
import { Twitch } from '../../services/TwitchService';
import { BingoEntry, BingoGame } from '../../EBS/BingoService/EBSBingoTypes';
import { BingoEditableEntry } from '../../model/BingoEntry';
import { BingoBroadcastEventType, BingoConfiguration } from '../../model/BingoConfiguration';
import { EBSVersion } from '../../EBS/EBSConfig';
import StatusCard from './StatusCard';
import LibraryEditor from './LibraryEditor';
import EntrySelectionView from './EntrySelectionView';
import GridConfigurationView from './GridConfigurationView';
require('./Config.scss')

export default function Config() {
    const [nextKey, setNextKey] = React.useState(0)
    const [columns, setColumns] = React.useState(3)
    const [rows, setRows] = React.useState(3)
    const [entries, setEntries] = React.useState<BingoEditableEntry[]>(new Array(0))
    const [selectedEntries, setSelectedEntries] = React.useState<number[]>(new Array(0))
    const [confirmationThresholdSeconds, setConfirmationThresholdSeconds] = React.useState(120)
    const [activeGame, setActiveGame] = React.useState<BingoGame>(null)
    const [isStarting, setStarting] = React.useState(false)
    const [isLoading, setLoading] = React.useState(true)
    const [canEnableChat, setCanEnableChat] = React.useState(false)
    const [isLoadingLog, setLoadingLog] = React.useState(true)
    const [logEntries, setLogEntries] = React.useState<EBSBingo.BingoLogEntry[]>(new Array(0))

    const isSelected = React.useCallback((entry: BingoEntry): boolean => selectedEntries.some(b => b == entry.key), [selectedEntries])

    const loadConfig = React.useCallback((broadcasterConfig: TwitchExtensionConfiguration) => {
        if (! broadcasterConfig?.content)
        {
            return;
        }
        TwitchExtHelper.rig.log(broadcasterConfig.content);
        var configContent = JSON.parse(broadcasterConfig.content);

        setNextKey(configContent?.nextKey ?? 0)
        setEntries(configContent?.entries ?? new Array(0))
        setSelectedEntries(configContent?.selectedEntries ?? new Array(0))
        setRows(configContent?.rows ?? 3)
        setColumns(configContent?.columns ?? 3)
        setConfirmationThresholdSeconds(configContent?.confirmationThreshold ?? 120)
        setCanEnableChat(TwitchExtHelper.features.isChatEnabled)

        
        const activeGameId: string = configContent.activeGameId ?? configContent.activeGame?.gameId
        if (activeGame?.gameId !== activeGameId)
        {
            BingoEBS.getGame(activeGameId)
                .then(game => {
                    setActiveGame(game)
                })
                .catch(error => {
                    console.log(`Error fetching game ${activeGameId}: ${error}`)
                })
                .finally(() => {
                    setLoading(false)
                })
        }
    }, [activeGame])

    React.useEffect(() => {
        Twitch.onConfiguration.push(loadConfig);
        return () => {
            var index = Twitch.onConfiguration.indexOf(loadConfig)
            if (index !== -1)
            {
                Twitch.onConfiguration.splice(index, 1)
            }
        }
    }, [])

    var refreshLog = game => {
        if (game)
        {
            setLoadingLog(true)
            BingoEBS.getGameLog(game.gameId)
            .then(logs => {
                setLogEntries(logs)
            })
            .finally(() => {
                setLoadingLog(false)
            })
        }
    }

    React.useEffect(() => {
        var onBroadcast = () => {
            refreshLog(activeGame)
        }
        Twitch.listen('broadcast', onBroadcast)

        return () => {
            Twitch.unlisten('broadcast', onBroadcast)
        }
    }, [activeGame])

    if (TwitchExtQuery.state === "testing")
    {
        React.useEffect(() => {
            console.log("Registering test polling for logs, activeGame " + activeGame)
            var timer = setInterval(() => 
            {
                refreshLog(activeGame)
            }, 1000)
    
            return () => {
                clearInterval(timer)
            }
        }, [activeGame])
    }

    const onAdd = React.useCallback((): void => {
        var newEntry = new BingoEditableEntry();
        newEntry.text = "";
        newEntry.isNew = true;
        newEntry.key = nextKey;
        setNextKey(nextKey + 1);
        setEntries(entries.concat([newEntry]));
    }, [nextKey, entries])

    const onSave = React.useCallback((): void => {
        const config: BingoConfiguration = {
            nextKey: nextKey,
            entries: entries,
            selectedEntries: selectedEntries,
            rows: rows,
            columns: columns,
            confirmationThreshold: confirmationThresholdSeconds,
            activeGameId: activeGame.gameId,
        }
        const serializedConfig = JSON.stringify(config);
        TwitchExtHelper.configuration.set('broadcaster', EBSVersion, serializedConfig);
        TwitchExtHelper.rig.log(serializedConfig);
        TwitchExtHelper.send('broadcast','application/json', {
            type: BingoBroadcastEventType.SetConfig,
            payload: config
        });
    }, [nextKey, entries, selectedEntries, rows, columns, confirmationThresholdSeconds, activeGame])

    const onAddToSelection = React.useCallback((entry: BingoEditableEntry): void => {
        if (! isSelected(entry))
        {
            setSelectedEntries(selectedEntries.concat(entry.key))
        }
    }, [selectedEntries])

    const onRemoveFromSelection = React.useCallback((entry: BingoEditableEntry): void => {
        console.log(`Removing entry ${entry.key} from selection`)
        if (entry && isSelected(entry))
        {
            var newEntries = selectedEntries.filter(key => key !== entry.key);
            setSelectedEntries(newEntries)
        }
    }, [selectedEntries])

    const onStart = React.useCallback((): void => {
        setStarting(true);
        BingoEBS.createGame({
            rows: rows,
            columns: columns,
            entries: selectedEntries.map<EBSBingo.BingoEntry>((entryKey: number, index: number) => {
                var entry:BingoEntry = entries.find(b => b.key == entryKey);
                if (! entry)
                {
                    throw "Missing entry with key " + entryKey;
                }
                return {
                    key: index + 1,
                    text: entry.text,
                };
            }),
            confirmationThreshold: EBSBingo.FormatTimespan(confirmationThresholdSeconds),
            enableChatIntegration: TwitchExtHelper.features.isChatEnabled,
        }).then((game)=> {
            console.log("Started game " + game.gameId);

            setActiveGame(game)
            
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
            console.log(configUpdateJson);
            TwitchExtHelper.send('broadcast','application/json', {
                type: BingoBroadcastEventType.Start,
                payload: game
            });
        }).finally(() => {
            setStarting(false);
        });
    }, [selectedEntries, entries, rows, columns, confirmationThresholdSeconds])

    const onStop = React.useCallback((): void => {
        if (! activeGame)
        {
            return;
        }
        BingoEBS.stopGame(activeGame.gameId).finally(() => {
            TwitchExtHelper.send('broadcast','application/json', {
                type: BingoBroadcastEventType.Stop,
                payload: activeGame
            })
            setActiveGame(null)
        })
    }, [activeGame])

    const onChangeEntry = React.useCallback((key: number, entry: BingoEditableEntry): void => {
        var index = entries.findIndex((entry) => { return entry.key == key; });
        if (index == -1){
            console.error("Could not find changed key " + key);
            return;
        }
        entries[index] = entry;
        setEntries(entries)
    }, [entries])

    const onDeleteEntry = React.useCallback((key: number): void => {
        var index = entries.findIndex((entry) => { return entry.key == key; });
        if (index == -1){
            console.error("Could not find key " + key + " to delete");
            return;
        }
        entries.splice(index, 1);
        setEntries(entries)
        setSelectedEntries(selectedEntries.filter(s => s != key))
    }, [entries, selectedEntries])

    const onEntriesUpload = (evt: React.ChangeEvent<HTMLInputElement>): void => {
        var file = evt.target.files[0];
        var reader = new FileReader();
        reader.onload = (ev: ProgressEvent<FileReader>) => {
            var content = ev.target.result as string;

            var entries:BingoEditableEntry[] = new Array(0);

            content.split('\n').forEach((line, index) => {
                if(! line) return;

                var newEntry = new BingoEditableEntry();
                newEntry.text = line;
                newEntry.isNew = false;
                newEntry.key = index;
                console.log("Entry: " + newEntry.key + " - " + newEntry.text)
                entries.push(newEntry);
            });
            setSelectedEntries(new Array(0))
            setNextKey(entries.length + 1)
            setEntries(entries)
        };
        reader.readAsText(file);
    }

    return (
        <React.Fragment>
            <StatusCard
                isActive={activeGame != null}
                isLoading={isLoading}
                onStop={onStop}
                isLoadingLog={isLoadingLog}
                entries={activeGame?.entries}
                logEntries={logEntries}
                onRefreshLog={() => refreshLog(activeGame)} />,
            <React.Fragment>
            {
                (activeGame != null || isLoading) ? null :
                [
                    <LibraryEditor
                        entries={entries}
                        selectedEntries={selectedEntries}
                        onAdd={onAdd}
                        onChangeEntry={onChangeEntry}
                        onDeleteEntry={onDeleteEntry}
                        onAddToSelection={onAddToSelection}
                        onEntriesUpload={onEntriesUpload}
                    />,
                    <EntrySelectionView
                        entries={entries}
                        selectedEntries={selectedEntries}
                        onAddToSelection={onAddToSelection}
                        onRemoveFromSelection={onRemoveFromSelection}
                    />,
                    <GridConfigurationView
                        columns={columns}
                        rows={rows}
                        confirmationThresholdSeconds={confirmationThresholdSeconds}
                        selectedEntriesLength={selectedEntries.length}
                        onColumnsChange={(columns) => setColumns(columns)}
                        onRowsChange={(rows) => setRows(rows)}
                        onConfirmationTimeoutChange={(timeout) => setConfirmationThresholdSeconds(timeout)}
                        onSave={onSave}
                        onStart={onStart}
                        isStarting={isStarting}
                        canEnableChat={canEnableChat}
                    />
                ]
            }
            </React.Fragment>
        </React.Fragment>
    )
}