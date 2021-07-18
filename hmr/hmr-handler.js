const hmr = require('./index');
const process = require('process');
let target = require('../tests/my-file');

console.log('Application started!');

let count = 0;

hmr('./tests/my-file.js', (event) => {
    console.log('Change caught');
    console.log(event);    
    if (event.added.length !== 0 || event.deleted.length !== 0) {
        process.exit(-1);
    }
});

