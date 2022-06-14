import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { GetCurrentLanguage } from './common/ExtensionUtils';
import VideoOverlay from './components/VideoOverlay/VideoOverlay'
import TypesafeI18n from './i18n/i18n-react'

ReactDOM.render(
    <TypesafeI18n locale={GetCurrentLanguage()}>
        <VideoOverlay />
    </TypesafeI18n>,
    document.getElementById("root") as HTMLElement
);