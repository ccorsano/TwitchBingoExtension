export type PaletteColor = {
    name: string,
    hex: string,
    rgb: number[],
    cmyk: number[],
    hsb: number[],
    hsl: number[],
    lab: number[],
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
        name:"Floral White",
        hex:"fbf7ef",
        rgb:[251,247,239],
        cmyk:[0,2,5,2],
        hsb:[40,5,98],
        hsl:[40,60,96],
        lab:[97,0,4]
    },
    baseHover:
    {
        name:"Cornsilk",
        hex:"fff3d6",
        rgb:[255,243,214],
        cmyk:[0,5,16,0],
        hsb:[42,16,100],
        hsl:[42,100,92],
        lab:[96,-1,15]
    },
    prompt:
    {
        name:"Dutch White",
        hex:"fae8bf",
        rgb:[250,232,191],
        cmyk:[0,7,24,2],
        hsb:[42,24,98],
        hsl:[42,86,86],
        lab:[92,0,22]
    },
    promptHover:
    {
        name:"Banana Mania",
        hex:"fae7b0",
        rgb:[250,231,176],
        cmyk:[0,8,30,2],
        hsb:[45,30,98],
        hsl:[45,88,84],
        lab:[92,-2,29]
    },
    pending:
    {
        name:"Banana Mania",
        hex:"ffe6a7",
        rgb:[255,230,167],
        cmyk:[0,10,35,0],
        hsb:[43,35,100],
        hsl:[43,100,83],
        lab:[92,0,34]
    },
    confirmed:
    {
        name:"Jasmine",
        hex:"ffe194",
        rgb:[255,225,148],
        cmyk:[0,12,42,0],
        hsb:[43,42,100],
        hsl:[43,100,79],
        lab:[90,0,41]
    },
    missed:
    {
        name:"Light Gray",
        hex:"d4d4d4",
        rgb:[212,212,212],
        cmyk:[0,0,0,17],
        hsb:[0,0,83],
        hsl:[0,0,83],
        lab:[85,0,0]
    }
}