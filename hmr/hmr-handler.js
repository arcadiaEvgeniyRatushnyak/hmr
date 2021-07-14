const hmr = require('./index');
let target = require('../tests/my-file');

console.log('Application started!');

hmr.hmr('./tests/my-file.js', (event) => {
    console.log('Change caught');
    console.log(event);

    target = require('../tests/my-file');
    
});

