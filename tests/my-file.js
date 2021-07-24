const ff = require('./my-file-dep');
const extra = require('./my-file-dep-extra');
console.log('My file: hello world!');
console.log('ffff');

//extra.hello();

module.exports.somefnc = function(msg) {
    console.log(msg);
}