import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { GetCurrentLanguage } from './common/ExtensionUtils';
import Config from './components/Config/Config'
import TypesafeI18n from './i18n/i18n-react'

ReactDOM.render(
    <TypesafeI18n initialLocale={GetCurrentLanguage()}>
        <Config />
    </TypesafeI18n>,
    document.getElementById("root") as HTMLElement
);