<script lang="ts">
import { Graphic, Item, Text, PrimaryText, SecondaryText } from "@smui/list"
import type { Dayjs } from "dayjs"
import type { BingoEntry, BingoLogEntry } from "../../EBS/BingoService/EBSBingoTypes"
import { NotificationType } from "../../EBS/BingoService/EBSBingoTypes"
import LL from '../../i18n/i18n-svelte';

    interface Props {
        index: number;
        entry: BingoEntry | undefined;
        log: BingoLogEntry;
        parsedTime: Dayjs;
    }

    let {
        index,
        entry,
        log,
        parsedTime
    }: Props = $props();

const timeFormat = 'YYYY-MM-DD HH:mm:ss (Z)'
</script>

{#key index}
{#if log.type == NotificationType.Confirmation}
<Item>
    <Graphic class="material-icons">check_circle</Graphic>
    <Text>
        <PrimaryText>
            {$LL.Config.GameLog.ConfirmationText({entryKey: entry?.key, entryText: entry?.text, playerNames: log.playerNames})}
        </PrimaryText>
        <SecondaryText>
            {parsedTime.format(timeFormat)}
        </SecondaryText>
    </Text>
</Item>
{:else if log.type == NotificationType.CompletedRow}
<Item>
    <Graphic class="material-icons">border_horizontal</Graphic>
    <Text>
        <PrimaryText>
            {$LL.Config.GameLog.CompletedRowText({entryKey: entry?.key, playersCount: log.playersCount})}
        </PrimaryText>
        <SecondaryText>
            {parsedTime.format(timeFormat)}
        </SecondaryText>
    </Text>
</Item>
{:else if log.type == NotificationType.CompletedColumn}
<Item>
    <Graphic class="material-icons">border_vertical</Graphic>
    <Text>
        <PrimaryText>
            {$LL.Config.GameLog.CompletedColText({entryKey: entry?.key, playersCount: log.playersCount})}
        </PrimaryText>
        <SecondaryText>
            {parsedTime.format(timeFormat)}
        </SecondaryText>
    </Text>
</Item>
{:else if log.type == NotificationType.CompletedGrid}
<Item>
    <Graphic class="material-icons">border_all</Graphic>
    <Text>
        <PrimaryText>
            {$LL.Config.GameLog.CompletedGridText({entryKey: entry?.key, playersCount: log.playersCount})}
        </PrimaryText>
        <SecondaryText>
            {parsedTime.format(timeFormat)}
        </SecondaryText>
    </Text>
</Item>
{:else if log.type == NotificationType.Start}
<Item>
    <Graphic class="material-icons">play_circle</Graphic>
    <Text>
        <PrimaryText>
            {$LL.Config.GameLog.StartedGameText()}
        </PrimaryText>
        <SecondaryText>
            {parsedTime.format(timeFormat)}
        </SecondaryText>
    </Text>
</Item>
{/if}
{/key}