import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { GetCurrentLanguage } from './common/ExtensionUtils';
import Mobile from './components/Mobile/Mobile'
import TypesafeI18n from './i18n/i18n-react'

ReactDOM.render(
    <TypesafeI18n locale={GetCurrentLanguage()}>
        <Mobile />
    </TypesafeI18n>,
    document.getElementById("root") as HTMLElement
);