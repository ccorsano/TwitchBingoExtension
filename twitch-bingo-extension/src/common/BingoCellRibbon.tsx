import React from 'react'

type BingoCellRibbonProps = {
    height: string,
    width: string,
    text: string,
    fillColor: string,
}

export default function BingoCellRibbon(props: BingoCellRibbonProps)
{
    return (
        <svg width={props.width} height={props.height} viewBox="0 0 100 100" version="1.1" xmlns="http://www.w3.org/2000/svg" style={{fillRule:'evenodd',clipRule:'evenodd',strokeLinejoin:'round', strokeMiterlimit:2, filter:"drop-shadow(-0.1vw 0.1vw 0.3vw rgba(0,0,0,0.5))"}}>
            <path d="M0,0L35,0L100,65L100,100L0,0" style={{fill:props.fillColor}}/>
            <g transform="translate(50,50) rotate(45)">
                <text x="0" y="-5" textAnchor="middle" textLength="80" lengthAdjust="spacingAndGlyphs" style={{fontSize:"1.2rem"}}>{props.text}</text>
            </g>
        </svg>
    )
}
