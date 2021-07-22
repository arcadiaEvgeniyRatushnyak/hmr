const hmr = require('./index');
const process = require('process');
let target = require('../tests/my-file');

console.log('Application started!');

hmr('./tests/my-file.js', (event) => {
    console.log('My-file changed:');
    console.log(event);

    if (event.added.length !== 0 || event.deleted.length !== 0) {
        process.exit(-1);
    }
});

hmr('./tests/my-file-dep.js', (event) => {
    console.log('My-file-dep changed:');
    console.log(event);
});

