import { loadLocaleAsync } from "../i18n/i18n-util.async";
import type { Locales } from "../i18n/i18n-types";
import { i18nObject, locales } from "../i18n/i18n-util";
import { TwitchExtQuery } from "./TwitchExtension";

export function GetCurrentLanguage(): Locales
{
    const queryLanguage = TwitchExtQuery.language
    const supportedLocale = locales.find(l => l === queryLanguage)
    return supportedLocale ?? "en"
}

export function seededRand(str: string) {
    const hash = xmur3(str)
    return xoshiro128ss(hash(), hash(), hash(), hash())
}

function xmur3(str: string) {
    for(var i = 0, h = 1779033703 ^ str.length; i < str.length; i++)
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353),
        h = h << 13 | h >>> 19;
    return function() {
        h = Math.imul(h ^ h >>> 16, 2246822507);
        h = Math.imul(h ^ h >>> 13, 3266489909);
        return (h ^= h >>> 16) >>> 0;
    }
}

function xoshiro128ss(a: number, b: number, c: number, d: number) {
    return function() {
        var t = b << 9, r = a * 5; r = (r << 7 | r >>> 25) * 9;
        c ^= a; d ^= b;
        b ^= c; a ^= d; c ^= t;
        d = d << 11 | d >>> 21;
        return (r >>> 0) / 4294967296;
    }
}