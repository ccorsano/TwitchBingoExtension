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
        <svg width={props.width} height={props.height} viewBox="0 0 70 70" version="1.1" xmlns="http://www.w3.org/2000/svg" style={{fillRule:'evenodd',clipRule:'evenodd',strokeLinejoin:'round', strokeMiterlimit:2, filter:"drop-shadow(-0.1vw 0.1vw 0.3vw rgba(0,0,0,0.5))"}}>
            <g transform="matrix(0.707107,0.707107,-0.707107,0.707107,-291.299,-718.827)">
                <path d="M797.054,284.466L730.475,284.36L712.582,302.258L814.946,302.363L797.054,284.466Z" style={{fill:props.fillColor}}/>
            </g>
            <g transform="matrix(0.707107,0.707107,-0.707107,0.707107,-241.85,-686.216)">
                <text x="680.243px" y="310.513px" style={{fontFamily:"'ArialMT', 'Arial', sans-serif", fontSize:"16px"}}>{props.text}</text>
            </g>
        </svg>
    )
}
