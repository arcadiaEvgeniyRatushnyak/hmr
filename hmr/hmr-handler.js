const hmr = require('./index');

hmr('./tests/my-file.js', (event) => {
    console.log('My-file changed:');
    console.log(event);
}, (err) => {
    console.log('Error caught:');
    console.log(err);
});

hmr('./tests/my-file-dep.js', (event) => {
    console.log('My-file-dep changed:');
    console.log(event);
});
