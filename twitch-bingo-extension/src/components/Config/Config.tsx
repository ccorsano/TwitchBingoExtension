import * as React from 'react';
import { TwitchExtensionConfiguration, TwitchExtHelper } from '../../common/TwitchExtension';
import { BingoEBS } from '../../EBS/BingoService/EBSBingoService';
import * as EBSBingo from '../../EBS/BingoService/EBSBingoTypes';
import { Twitch } from '../../services/TwitchService';
import { BingoEntry, BingoGame } from '../../EBS/BingoService/EBSBingoTypes';
import { BingoEditableEntry } from '../../model/BingoEntry';
import { EBSVersion } from '../../EBS/EBSConfig';
import StatusCard from './StatusCard';
import LibraryEditor from './LibraryEditor';
import EntrySelectionView from './EntrySelectionView';
import GridConfigurationView from './GridConfigurationView';

export default function Config() {
    const [nextKey, setNextKey] = React.useState(0)
    const [columns, setColumns] = React.useState(3)
    const [rows, setRows] = React.useState(3)
    const [entries, setEntries] = React.useState<BingoEditableEntry[]>(new Array(0))
    const [selectedEntries, setSelectedEntries] = React.useState<number[]>(new Array(0))
    const [confirmationThresholdSeconds, setConfirmationThresholdSeconds] = React.useState(120)
    const [activeGame, setActiveGame] = React.useState<BingoGame>(null)

    const isSelected = (entry: BingoEntry): boolean => selectedEntries.some(b => b == entry.key);

    const loadConfig = (broadcasterConfig: TwitchExtensionConfiguration) => {
        if (! broadcasterConfig)
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
        setActiveGame(configContent?.activeGame)
    }

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

    const onAdd = (): void => {
        var newEntry = new BingoEditableEntry();
        newEntry.text = "";
        newEntry.isNew = true;
        newEntry.key = nextKey;
        setNextKey(nextKey + 1);
        setEntries(entries.concat([newEntry]));
    }

    const onSave = (): void => {
        const serializedConfig = JSON.stringify({
            nextKey: nextKey,
            entries: entries,
            selectedEntries: selectedEntries,
            rows: rows,
            columns: columns,
            confirmationThreshold: confirmationThresholdSeconds,
            activeGame: activeGame,
        });
        TwitchExtHelper.configuration.set('broadcaster', EBSVersion, serializedConfig);
        TwitchExtHelper.rig.log(serializedConfig);
        TwitchExtHelper.send('broadcast','application/json', {
            type: "set-config",
            payload: {
                entries: entries,
                selectedEntries: selectedEntries,
                rows: rows,
                columns: columns,
                confirmationThreshold: confirmationThresholdSeconds,
            }
        });
    }

    const onAddToSelection = (entry: BingoEditableEntry): void => {
        if (! isSelected(entry))
        {
            setSelectedEntries(selectedEntries.concat(entry.key))
        }
    }

    const onRemoveFromSelection = (entry: BingoEditableEntry): void => {
        if (entry && isSelected(entry))
        {
            var index = selectedEntries.indexOf(entry.key);
            setSelectedEntries(selectedEntries.splice(index, 1))
        }
    }

    const onStart = (): void => {
        BingoEBS.createGame({
            rows: rows,
            columns: columns,
            entries: selectedEntries.map<EBSBingo.BingoEntry>((entryKey: number) => {
                var entry:BingoEntry = entries.find(b => b.key == entryKey);
                if (! entry)
                {
                    throw "Missing entry with key " + entryKey;
                }
                return {
                    key: entry.key,
                    text: entry.text,
                };
            }),
            confirmationThreshold: EBSBingo.FormatTimespan(confirmationThresholdSeconds)
        }).then((game)=> {
            console.log("Started game " + game.gameId);

            setActiveGame(game)
            
            var configUpdateJson = JSON.stringify({
                nextKey: nextKey,
                entries: entries,
                selectedEntries: selectedEntries,
                rows: rows,
                columns: columns,
                confirmationThreshold: confirmationThresholdSeconds,
                activeGame: game,
            })
            TwitchExtHelper.configuration.set('broadcaster', EBSVersion, configUpdateJson);
            console.log(configUpdateJson);
            TwitchExtHelper.send('broadcast','application/json', {
                type: "start",
                payload: game
            });
        });
    }

    const onStop = (): void => {
        if (! activeGame)
        {
            return;
        }
        BingoEBS.stopGame(activeGame.gameId).finally(() => {
            TwitchExtHelper.send('broadcast','application/json', {
                type: "stop",
                payload: activeGame
            })
            setActiveGame(null)
        })
    }

    const onChangeEntry = (key: number, entry: BingoEditableEntry): void => {
        var index = entries.findIndex((entry) => { return entry.key == key; });
        if (index == -1){
            console.error("Could not find changed key " + key);
            return;
        }
        entries[index] = entry;
        setEntries(entries)
    }

    const onDeleteEntry = (key: number): void => {
        var index = entries.findIndex((entry) => { return entry.key == key; });
        if (index == -1){
            console.error("Could not find key " + key + " to delete");
            return;
        }
        entries.splice(index, 1);
        setEntries(entries)
        setSelectedEntries(selectedEntries.filter(s => s != key))
    }

    const onEntriesUpload = (evt: React.ChangeEvent<HTMLInputElement>): void => {
        var file = evt.target.files[0];
        var reader = new FileReader();
        reader.onload = (ev: ProgressEvent<FileReader>) => {
            var content = ev.target.result as string;

            var entries:BingoEditableEntry[] = new Array(0);

            content.split('\n').forEach(line => {
                if(! line) return;

                var newEntry = new BingoEditableEntry();
                newEntry.text = line;
                newEntry.isNew = false;
                newEntry.key = nextKey;
                console.log("Entry: " + newEntry.key + " - " + newEntry.text)
                entries.push(newEntry);
            });
            setNextKey(nextKey + 1)
            setEntries(entries)
            setSelectedEntries(new Array(0))
        };
        reader.readAsText(file);
    }

    return (
        <React.Fragment>
            <StatusCard isActive={activeGame != null} onStop={onStop} />,
            <React.Fragment>
            {
                activeGame != null ? null :
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
                    />
                ]
            }
            </React.Fragment>
        </React.Fragment>
    )
}