export type PaletteColor = {
    name: string,
    hex: string,
    rgb: number[]
}

export function getRGB(color: PaletteColor): string {
    return `rgb(${color.rgb[0]},${color.rgb[1]},${color.rgb[2]})`
}

export function getHex(color: PaletteColor): string {
    return `#${color.hex}`
}

// Current palette
// https://coolors.co/fbf7ef-fff3d6-fae8bf-fae7b0-ffe6a7-ffe39d-ffe194
export const jasminePalette = {
    base:
    {
        name:"White",
        hex:"FFF",
        rgb:[255,255,255]
    },
    baseHover:
    {
        name:"Alice Blue",
        hex:"E7F2F9",
        rgb:[231,242,249]
    },
    prompt:
    {
        name:"Cadet Grey",
        hex:"8296A6",
        rgb:[130,150,166]
    },
    promptHover:
    {
        name:"Cadet Grey (Light)",
        hex:"A0AFBB",
        rgb:[160,175,187]
    },
    pending:
    {
        name:"Slate gray",
        hex:"617889",
        rgb:[97,120,137]
    },
    confirmed:
    {
        name:"Cadet Grey",
        hex:"94A5B3",
        rgb:[148, 165, 179]
    },
    missed:
    {
        name:"Light Gray",
        hex:"d4d4d4",
        rgb:[212,212,212]
    }
}