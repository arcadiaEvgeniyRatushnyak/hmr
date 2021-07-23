const hmr = require('./index');
const target = require('../tests/my-file');

hmr('./tests/my-file.js', (event) => {
    console.log('My-file changed:');
    console.log(event);
});

hmr('./tests/my-file-dep.js', (event) => {
    console.log('My-file-dep changed:');
    console.log(event);
});
