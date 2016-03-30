import React from 'react';
import ReactDOM from 'react-dom';

import FLIP from './FLIP';

function render(className) {
    ReactDOM.render(
            <FLIP className={className} component="h2" flipProperties={['opacity', 'color']}>This is only a test.</FLIP>,
            document.getElementById('app-container')
    );
}

let isCentered = false;
render('example example-normal');
document.addEventListener('mousedown', () => {
    isCentered = !isCentered;
    render('example ' + (isCentered ? 'example-centered' : 'example-normal'));
});
