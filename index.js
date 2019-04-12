'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./dist/JsBridgeAdapter.min.js');
} else {
  module.exports = require('./dist/JsBridgeAdapter.js');
}
