import React from 'react'
require('./LinearIndeterminateLoader.scss')

type LinearIndeterminateLoaderProps = {
    style?: React.CSSProperties
}

export default function LinearIndeterminateLoader(props: LinearIndeterminateLoaderProps)
{
    return (
        <div className="linear-indeterminate-loader" style={props.style}></div>
    )
}