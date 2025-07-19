<script lang="ts">
    import type { Readable, Writable } from "svelte/store";
    import { GameModerationContextKey } from "../stores/moderation";
    import type { BingoGameModerationContext } from "./BingoGameModerationContext";
    import { getContext, onMount } from "svelte";
    import { TwitchExtHelper } from "./TwitchExtension";
    import { BingoBroadcastEventType, type BingoBroadcastEvent } from "../model/BingoConfiguration";
    import { ParseTimespan, type BingoConfirmationNotification, type BingoEntry, type BingoGame, type BingoTentative, type BingoTentativeNotification } from "../EBS/BingoService/EBSBingoTypes";
    import type { BingoGameContext } from "./BingoGameContext";
    import { GameContextKey } from "../stores/game";
    import dayjs from "dayjs";
    import utc from "dayjs/plugin/utc"
    import { BingoEBS } from "../EBS/BingoService/EBSBingoService";
    import type { EBSError } from "src/EBS/EBSBase";

    interface Props {
        onReceiveTentative?: ((notification: BingoTentativeNotification) => void) | undefined;
        onReceiveConfirmation?: ((tentative: BingoTentative) => void) | undefined;
        onNotificationsEmpty?: (() => void) | undefined;
        children?: import('svelte').Snippet;
    }

    let {
        onReceiveTentative = undefined,
        onReceiveConfirmation = undefined,
        onNotificationsEmpty = undefined,
        children
    }: Props = $props();

    dayjs.extend(utc);

    const moderationContext: Writable<BingoGameModerationContext> = getContext(GameModerationContextKey)
    const gameContext: Readable<BingoGameContext> = getContext(GameContextKey)
    let pendingConfirmations: BingoConfirmationNotification[] = Array<BingoConfirmationNotification>(0)
    let notificationInterval: NodeJS.Timeout | undefined = undefined

    gameContext.subscribe((context: BingoGameContext) => {
        if (context.game)
        {
            if (notificationInterval)
            {
                clearInterval(notificationInterval)
            }
            const confirmationThreshold = ParseTimespan(context.game.confirmationThreshold)
            notificationInterval = setInterval(() => {
                var currentTime = dayjs.utc()
                var remaining = new Array<BingoConfirmationNotification>(0)
                pendingConfirmations.forEach(confirmation => {
                    var confirmationTime = dayjs(confirmation.confirmationTime)
                    var expirationTime = confirmationTime.add(confirmationThreshold, 'ms')
                    if (currentTime > expirationTime)
                    {
                        BingoEBS.notify(confirmation.gameId, confirmation.key.toString())
                    }
                    else
                    {
                        remaining.push(confirmation)
                    }
                });
                pendingConfirmations = remaining
            }, 1000)
        }
    }, (_context) => {
        clearInterval(notificationInterval)
        notificationInterval = undefined
    })

    moderationContext.subscribe(context => {
        if (context.tentatives.length === 0 && onNotificationsEmpty)
        {
            onNotificationsEmpty()
        }
    })
    
    const receiveTentative = (notification: BingoTentativeNotification) => {
        if (pendingConfirmations.some(c => c.gameId === notification.gameId && c.key === notification.key))
        {
            return;
        }

        const tryAddTentative = (currentTentatives: BingoTentativeNotification[]):BingoTentativeNotification[] => {
            // Skip if a tentative is already pending for this key
            if (currentTentatives.some(t => t.gameId == notification.gameId && t.key == notification.key)
                || pendingConfirmations.some(t => t.gameId == notification.gameId && t.key == notification.key))
            {
                return currentTentatives
            }
            return [...currentTentatives, notification]
        }

        $moderationContext.tentatives = tryAddTentative($moderationContext.tentatives)
        
        if (onReceiveTentative)
        {
            onReceiveTentative(notification);
        }
    }

    const receiveConfirmation = (confirmation: BingoConfirmationNotification) => {
        pendingConfirmations = [... pendingConfirmations, confirmation]
        $moderationContext.tentatives = $moderationContext.tentatives.filter(t => t.key != confirmation.key)
        $gameContext.onConfirmation(confirmation)
    }

    const onReceiveWhisper = (_target: string, _contentType: string, messageStr: string) => {
        console.log(`Received whisper for ${'whisper-' + TwitchExtHelper.viewer.opaqueId} ${messageStr}`);
        let message: BingoBroadcastEvent = JSON.parse(messageStr, (key, value) => {
            if (key == "tentativeTime" || key == "confirmationTime")
            {
                return new Date(value);
            }
            return value;
        });
        switch (message.type) {
            case BingoBroadcastEventType.Tentative:
                var notification = message.payload as BingoTentativeNotification
                receiveTentative(notification)
                break;
            case BingoBroadcastEventType.Confirm:
                var confirm = message.payload as BingoConfirmationNotification
                receiveConfirmation(confirm)
                break;
            default:
                break;
        }
    }

    const processTentative = (entry: BingoEntry) =>
    {
        console.log("Confirmed tentative for key " + entry.key)
    }
    
    const onConfirm = (entry: BingoEntry) => {
        let game = $gameContext.game
        if (game)
        {
            BingoEBS.confirm(game.gameId, entry.key.toString()).then(tentative => {
                processTentative(entry)
                if (onReceiveConfirmation)
                {
                    onReceiveConfirmation(tentative)
                }
            }, (reason: EBSError) => {
                // If entry was already confirmed, consider it done
                if (reason.status == 409)
                {
                    processTentative(entry)
                }
                else
                {
                    throw reason
                }
            })
        }
    }

    const onTentativeExpire = (notification: BingoEntry) =>
    {
        $moderationContext.tentatives = $moderationContext.tentatives.filter(t => t.key != notification.key)
    }

    const onTestTentative = (entry: BingoEntry) => {
        let game = $gameContext.game
        if (game)
        {
            var notification: BingoTentativeNotification = {
                gameId: game.gameId,
                key: entry.key,
                tentativeTime: new Date(Date.now())
            }
            receiveTentative(notification)
        }
    }

    const onForceNotify = (entry: BingoEntry) => {
        let game = $gameContext.game
        if (game)
        {
            var fakeConfirmation: BingoConfirmationNotification = {
                gameId: game.gameId,
                confirmationTime: dayjs.utc().toDate(),
                confirmedBy: 'me',
                key: entry.key
            }
            pendingConfirmations = [...pendingConfirmations, fakeConfirmation]
        }
    }
    
    onMount(() => {
        console.log(`Registering listener for ${'whisper-' + TwitchExtHelper.viewer.opaqueId}`)
        TwitchExtHelper.listen('whisper-' + TwitchExtHelper.viewer.opaqueId, onReceiveWhisper)

        return () => {
            console.log(`Unregistering listener for ${'whisper-' + TwitchExtHelper.viewer.opaqueId}`)
            TwitchExtHelper.unlisten('whisper-' + TwitchExtHelper.viewer.opaqueId, onReceiveWhisper)
        }
    })

    moderationContext.update(mc => {
        mc.onForceNotify = onForceNotify
        mc.onConfirm = onConfirm
        mc.onTentativeExpire = onTentativeExpire
        mc.onTestTentative = onTestTentative
        return mc
    })
</script>

{@render children?.()}