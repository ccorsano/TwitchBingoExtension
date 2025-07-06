<script lang="ts">
import { Graphic, Item, Text, PrimaryText, SecondaryText } from "@smui/list"
import type { Dayjs } from "dayjs"
import dayjs from "dayjs"
import type { BingoEntry, BingoLogEntry } from "../../EBS/BingoService/EBSBingoTypes"
import { NotificationType } from "../../EBS/BingoService/EBSBingoTypes"
import LL from '../../i18n/i18n-svelte';
    import { Icon } from "@smui/button";

export let index: number
export let entry: BingoEntry | undefined
export let log: BingoLogEntry
export let parsedTime: Dayjs

const timeFormat = 'YYYY-MM-DD HH:mm:ss (Z)'
</script>

{#key index}
{#if log.type == NotificationType.Confirmation}
<Item>
    <Graphic class="material-icons">check-circle</Graphic>
    <Text>
        <PrimaryText>
            <div class="body2">
                {$LL.Config.GameLog.ConfirmationText({entryKey: entry?.key, entryText: entry?.text, playerNames: log.playerNames})}
            </div>
        </PrimaryText>
        <SecondaryText>
            {parsedTime.format(timeFormat)}
        </SecondaryText>
    </Text>
</Item>
{:else if log.type == NotificationType.CompletedRow}
<Item>
    <Graphic class="material-icons">border-horizontal</Graphic>
    <Text>
        <PrimaryText>
            <div class="body2">
                {$LL.Config.GameLog.CompletedRowText({entryKey: entry?.key, playersCount: log.playersCount})}
            </div>
        </PrimaryText>
        <SecondaryText>
            {parsedTime.format(timeFormat)}
        </SecondaryText>
    </Text>
</Item>
{:else if log.type == NotificationType.CompletedColumn}
<Item>
    <Graphic class="material-icons">border-vertical</Graphic>
    <Text>
        <PrimaryText>
            <div class="body2">
                {$LL.Config.GameLog.CompletedColText({entryKey: entry?.key, playersCount: log.playersCount})}
            </div>
        </PrimaryText>
        <SecondaryText>
            {parsedTime.format(timeFormat)}
        </SecondaryText>
    </Text>
</Item>
{:else if log.type == NotificationType.CompletedGrid}
<Item>
    <Graphic class="material-icons">border-all</Graphic>
    <Text>
        <PrimaryText>
            <div class="body2">
                {$LL.Config.GameLog.CompletedGridText({entryKey: entry?.key, playersCount: log.playersCount})}
            </div>
        </PrimaryText>
        <SecondaryText>
            {parsedTime.format(timeFormat)}
        </SecondaryText>
    </Text>
</Item>
{:else if log.type == NotificationType.Start}
<Item>
    <Graphic class="material-icons">playcirclefilled</Graphic>
    <Text>
        <PrimaryText>
            <div class="body2">
                {$LL.Config.GameLog.StartedGameText()}
            </div>
        </PrimaryText>
        <SecondaryText>
            {parsedTime.format(timeFormat)}
        </SecondaryText>
    </Text>
</Item>
{/if}
{/key}