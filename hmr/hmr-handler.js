const hmr = require('./index');
let target = require('../tests/my-file');

console.log('Application started!');

let count = 0;

hmr('./tests/my-file.js', (event) => {
    console.log('Change caught');
    console.log(event);    
    if (event.deleted.length !== 0) {
        count++;
        console.error('Fail ' + count);
    }
});

