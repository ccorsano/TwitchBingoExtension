import * as React from 'react';
import * as ReactDOM from 'react-dom';
import Mobile from './components/Mobile/Mobile'
import TypesafeI18n from './i18n/i18n-react'

ReactDOM.render(
    <TypesafeI18n initialLocale="en">
        <Mobile />
    </TypesafeI18n>,
    document.getElementById("root") as HTMLElement
);