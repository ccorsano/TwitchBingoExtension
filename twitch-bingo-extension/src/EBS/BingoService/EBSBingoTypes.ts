import { BingoEntryState } from "../../model/BingoEntry";

export interface BingoEntry {
    key: number;
    text: string;
    confirmedAt?: Date;
    confirmedBy?: string;
}

export const DefaultEntry: BingoEntry = {
    key: 0,
    text: "",
    confirmedAt: undefined,
    confirmedBy: undefined
}

export interface BingoGame {
    gameId: string;
    channelId: string;
    entries: BingoEntry[];
    rows: number;
    columns: number;
    confirmationThreshold: string;
}

export interface BingoGameCreationParams {
    rows: number;
    columns: number;
    entries: BingoEntry[];
    confirmationThreshold: string;
    enableChatIntegration: boolean;
}

export interface BingoTentative {
    entryKey: string;
    confirmed: boolean;
    tentativeTime: string; // ISO date
}

export interface BingoGridCell {
    row: number;
    col: number;
    key: number;
    state: BingoEntryState;
}

export interface BingoGrid {
    gameId: string;
    playerId: string;
    cols: number;
    rows: number;
    cells: BingoGridCell[];
}

export interface BingoTentativeNotification {
    gameId: string;
    key: number;
    tentativeTime: Date;
    confirmationTime?: Date;
    confirmedBy?: string;
}

export interface BingoConfirmationNotification {
    gameId: string;
    key: number;
    confirmationTime: Date;
    confirmedBy: string;
}

export enum NotificationType {
    CompletedRow = 0,
    CompletedColumn = 1,
    CompletedGrid = 2,
    Confirmation = 3,
    Missed = 4,
    Start = 5,
}

export interface BingoLogEntry {
    gameId: string;
    key: number;
    type: NotificationType;
    playersCount: number;
    playerNames: string[];
    timestamp: string;
}

const TimeSpanRegexp = (/^(-?)((\d+)\.)?(\d{2}):(\d{2}):(\d{2})(\.(\d{7}))?$/);
export function ParseTimespan(timeSpan: string): number
{
    var result = TimeSpanRegexp.exec(timeSpan);

    if (result == null)
    {
        return NaN;
    }

    var isNegative = result[1] === "-";
    var days = result[2] === undefined ? 0 : Number.parseInt(result[2]);
    var hours = Number.parseInt(result[4]);
    var minutes = Number.parseInt(result[5]);
    var secondes = Number.parseInt(result[6]);
    var nanoseconds = result[8] === undefined ? 0 : Number.parseInt(result[8]);

    // Calculate in seconds, then convert to microseconds and add remaining microseconds
    return (isNegative ? -1 : 1) * (((days * 3600 * 24) + (hours * 3600) + (minutes * 60) + secondes) * 1000 + (nanoseconds/10000));
}

export function FormatTimeout(seconds: number): string
{
    if (seconds < 0)
    {
        return "00:00"
    }
    const minutes = (Math.floor(seconds / 60))
    const minutesStr = minutes.toFixed(0).padStart(2, "0")
    const secondsStr = Math.floor(seconds - (minutes * 60)).toFixed(0).padStart(2, "0")

    return minutesStr + ":" + secondsStr
}

export function FormatTimespan(seconds: number): string
{
    const days = Math.floor(seconds / (3600 * 24))
    seconds = seconds - (days * 3600 * 24)
    const hours = Math.floor(seconds / 3600)
    seconds = seconds - (hours * 3600)
    const minutes = Math.floor(seconds / 60)
    seconds = seconds - (minutes * 60)
    const secondsOut = Math.floor(seconds)
    seconds = seconds - secondsOut
    const milliseconds = Math.floor(seconds * 1000)

    return `${days == 0 ? '' : days + "."}${hours.toString().padStart(2,"0")}:${minutes.toString().padStart(2,"0")}:${secondsOut.toString().padStart(2,"0")}${milliseconds == 0 ? '' : "." + milliseconds.toString().padStart(4, "0")}`
}