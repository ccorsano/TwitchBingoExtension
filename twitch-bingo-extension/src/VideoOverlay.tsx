import * as React from 'react';
import * as ReactDOM from 'react-dom';
import VideoOverlay from './components/VideoOverlay/VideoOverlay'
import TypesafeI18n from './i18n/i18n-react'

ReactDOM.render(
    <TypesafeI18n initialLocale="en">
        <VideoOverlay />
    </TypesafeI18n>,
    document.getElementById("root") as HTMLElement
);