import { Locales } from "../i18n/i18n-types";
import { locales } from "../i18n/i18n-util";
import { TwitchExtQuery } from "./TwitchExtension";

export function GetCurrentLanguage(): Locales
{
    const queryLanguage = TwitchExtQuery.language
    console.log(`Query language : ${queryLanguage}`)
    const supportedLocale = locales.find(l => l === queryLanguage)
    return supportedLocale ?? "en"
}