import * as React from 'react';
import * as ReactDOM from 'react-dom';
import LiveConfig from './components/LiveConfig/LiveConfig'
import TypesafeI18n from './i18n/i18n-react'

ReactDOM.render(
    <TypesafeI18n initialLocale="en">
        <LiveConfig />
    </TypesafeI18n>,
    document.getElementById("root") as HTMLElement
);