const hmr = require('./index');
const process = require('process');

console.log('Application started!');

hmr('./tests/my-file.js', (event) => {
    console.log('My-file changed:');
    console.log(event);
});

hmr('./tests/my-file-dep.js', (event) => {
    console.log('My-file-dep changed:');
    console.log(event);
});

