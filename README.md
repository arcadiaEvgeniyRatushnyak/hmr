# node-hmr

[![Build Status](https://travis-ci.org/nicebro/node-hmr.svg?branch=master)](https://travis-ci.org/nicebro/node-hmr)
[![Coverage Status](https://coveralls.io/repos/github/nicebro/node-hmr/badge.svg?branch=master)](https://coveralls.io/github/nicebro/node-hmr?branch=master)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

## 🔥 Hot Module Replacement for Node.js
This module adds hot module replacement support for node.js applications, it intended as an alternative to such tools like nodemon. Reloading modules while an application is running significantly faster than full reloading which in some cases may add additional downtime to a development process.

Inspired by this article [https://codeburst.io/dont-use-nodemon-there-are-better-ways-fc016b50b45e](https://codeburst.io/dont-use-nodemon-there-are-better-ways-fc016b50b45e)


## API
```js
hmr(target, callback)
```

* `target` File to watch. Changes of file and it's dependecies will be caught
* `callback` Function which will be called each time when some file was changed

## Usage
```js
const hmr = require('./hmr/hmr-handler');

hmr('./path-to-your-script', (event) => {
  console.log(event);
});

```
## How to use it with frameworks
You should split your application into two parts first is server setup and second is application module.
Below are examples of how to use it with some popular frameworks.

## Limitations
In some cases, HMR may not work correctly with libraries which using some internal caching storage
Mongoose is the example of one. If you see this error message ```Cannot overwrite `User` model once compiled``` the workaround could be add the following syntax to each model declaration, but in this case changes to the model will not be 'hot reloaded'.
```js
module.exports = mongoose.models.Users || mongoose.model('Users', UsersSchema);
```

## License
[MIT](LICENSE)
