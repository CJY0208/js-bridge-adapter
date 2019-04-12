(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.JsBridgeAdapter = {})));
}(this, (function (exports) { 'use strict';

  // 值类型判断 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  var isUndefined = function isUndefined(val) {
    return typeof val === 'undefined';
  };

  var isFunction = function isFunction(val) {
    return typeof val === 'function';
  };

  var isString = function isString(val) {
    return typeof val === 'string';
  };
  // 值类型判断 -------------------------------------------------------------

  var get = function get(obj) {
    var keys = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
    var defaultValue = arguments[2];

    try {
      var result = (isString(keys) ? keys.split('.') : keys).reduce(function (res, key) {
        return res[key];
      }, obj);
      return isUndefined(result) ? defaultValue : result;
    } catch (e) {
      return defaultValue;
    }
  };

  var run = function run(obj) {
    for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
      args[_key - 2] = arguments[_key];
    }

    var keys = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    keys = isString(keys) ? keys.split('.') : keys;

    var func = get(obj, keys);
    var context = get(obj, keys.slice(0, -1));

    return isFunction(func) ? func.call.apply(func, [context].concat(args)) : func;
  };

  var uuid = 0;

  var uniqueId = function uniqueId() {
    var prefix = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
    return prefix + '_' + ++uuid + '_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
  };

  var getGlobal = function getGlobal() {
    if (typeof self !== 'undefined') {
      return self;
    }
    if (typeof window !== 'undefined') {
      return window;
    }
    if (typeof global !== 'undefined') {
      return global;
    }
    throw new Error('unable to locate global object');
  };

  var globalThis = getGlobal();

  var globalize = function globalize(handler) {
    var _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$name = _ref.name,
        name = _ref$name === undefined ? uniqueId('__globalFunction') : _ref$name,
        _ref$once = _ref.once,
        once = _ref$once === undefined ? false : _ref$once;

    if (typeof handler === 'string') {
      return handler;
    }

    globalThis[name] = function () {
      if (typeof handler === 'function') {
        handler.apply(undefined, arguments);
      }

      if (once) {
        delete globalThis[name];
      }
    };

    return name;
  };

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var EventBus = function EventBus() {
    var _this = this;

    _classCallCheck(this, EventBus);

    this.__listeners = {};

    this.subscribe = function (event, listener) {
      var once = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : false;

      if (!isFunction(listener)) {
        return console.error('[EventBus Error] listener is not a function');
      }

      _this.__listeners[event] = [].concat(_toConsumableArray(get(_this.__listeners, event, [])), [Object.assign(listener, { once: once })]);
    };

    this.notify = function (event) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      _this.__listeners[event] = run(_this.__listeners, event + '.filter', function (listener) {
        run.apply(undefined, [listener, undefined].concat(args));
        return !listener.once;
      });
    };
  };

  var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

  function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

  function _classCallCheck$1(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var isFunction$1 = function isFunction(value) {
    return typeof value === 'function';
  };
  var parseConfig = function parseConfig(config) {
    if (typeof config === 'function') {
      return {
        getExecutor: config
      };
    }

    return config;
  };

  var DynamicFunction = function DynamicFunction(config) {
    _classCallCheck$1(this, DynamicFunction);

    var _parseConfig = parseConfig(config),
        _parseConfig$name = _parseConfig.name,
        name = _parseConfig$name === undefined ? '' : _parseConfig$name,
        getExecutor = _parseConfig.getExecutor;

    var func = _defineProperty({}, name, function () {
      for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      var executor = getExecutor.apply(this, args);

      if (!isFunction$1(executor)) {
        return;
      }

      return executor.apply(this, args);
    })[name];

    var commonPropertyProps = {
      configurable: true,
      enumerable: false
    };

    Object.defineProperty(func, 'name', _extends({
      value: name,
      writable: false
    }, commonPropertyProps));

    Object.defineProperty(func, 'length', _extends({}, commonPropertyProps, {
      get: function get() {
        var executor = getExecutor();

        if (!isFunction$1(executor)) {
          return -1;
        }

        return executor.length;
      }
    }));

    func.getExecutor = getExecutor;
    func.isExecutable = function () {
      for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return isFunction$1(getExecutor.apply.apply(getExecutor, [this].concat(args)));
    };

    return func;
  };

  function _classCallCheck$2(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var parseConfig$1 = function parseConfig(config) {
    if (typeof config === 'function') {
      return {
        runner: config
      };
    }

    return config;
  };

  var Api = function Api() {
    var config = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _classCallCheck$2(this, Api);

    var _parseConfig = parseConfig$1(config),
        _parseConfig$runner = _parseConfig.runner,
        runner = _parseConfig$runner === undefined ? Api.default.runner : _parseConfig$runner,
        _parseConfig$isSuppor = _parseConfig.isSupported,
        isSupported = _parseConfig$isSuppor === undefined ? Api.default.isSupported : _parseConfig$isSuppor,
        _parseConfig$name = _parseConfig.name,
        name = _parseConfig$name === undefined ? get(runner, 'name') : _parseConfig$name,
        _parseConfig$getRunne = _parseConfig.getRunner,
        getExecutor = _parseConfig$getRunne === undefined ? function () {
      return isFunction(runner) && isSupported() ? runner : false;
    } : _parseConfig$getRunne;

    var func = new DynamicFunction({
      name: name,
      getExecutor: getExecutor
    });

    func.isSupported = func.isExecutable;
    func.getRunner = func.getExecutor;

    delete func.isExecutable;
    delete func.getExecutor;

    return func;
  };

  Api.default = {
    isSupported: function isSupported() {
      return true;
    },
    runner: undefined
  };

  function _classCallCheck$3(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  var Bridge = function Bridge() {
    var _this = this;

    var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'anonymous';

    _classCallCheck$3(this, Bridge);

    this.eventBus = new EventBus();
    this.isReady = false;
    this.configured = false;
    this.runAfterReady = false;
    this.apis = {};

    this.onReady = function (listener) {
      _this.eventBus.subscribe('ready', listener, true);
      if (_this.isReady) {
        _this.eventBus.notify('ready');
      }

      return _this;
    };

    this.ready = function () {
      if (_this.isReady) {
        return console.error('[Warning] Bridge "' + _this.name + '" is ready');
      }

      _this.isReady = true;
      _this.eventBus.notify('ready');
    };

    this.config = function () {
      var _ref = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          support = _ref.support,
          getRunner = _ref.api,
          _ref$runAfterReady = _ref.runAfterReady,
          runAfterReady = _ref$runAfterReady === undefined ? false : _ref$runAfterReady;

      if (_this.configured) {
        console.error('[Warning] Bridge "' + _this.name + '" has been configured');
        return _this;
      }

      _this.bridgeSupport = support;
      _this.getRunner = getRunner;
      _this.runAfterReady = runAfterReady;
      _this.configured = true;

      return _this;
    };

    this.support = function (key) {
      var runner = _this.get(key);
      var isSupported = run(runner, 'isSupported');

      return !!isSupported;
    };

    this.api = function (key) {
      var _ref2 = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
          _ref2$runner = _ref2.runner,
          runner = _ref2$runner === undefined ? _this.getRunner(key) : _ref2$runner;

      var bridgeRunner = new Api({
        name: key,
        runner: runner,
        isSupported: function isSupported() {
          if (!_this.isReady) {
            return false;
          }
          return _this.bridgeSupport(key);
        }
      });

      bridgeRunner.isFromBridge = true;
      bridgeRunner.customize = function (getCustomizedRunner) {
        return _this.api(key, {
          runner: getCustomizedRunner(runner)
        });
      };

      return bridgeRunner;
    };

    this.register = function () {
      var apis = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

      Object.assign(_this.apis, run(apis, undefined, _this.api));
      return _this;
    };

    this.has = function (key) {
      return !!_this.apis[key];
    };

    this.get = function (key) {
      return _this.apis[key];
    };

    this.call = function (key) {
      for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        args[_key - 1] = arguments[_key];
      }

      if (!_this.has(key)) {
        return console.warn('[Unregistered] Api "' + key + '" is unregistered in Bridge "' + _this.name + '"');
      }

      var api = _this.get(key);
      var exec = function exec() {
        var runner = run(api, 'getRunner');

        if (!isFunction(runner)) {
          return console.warn('[Not Supported] Api "' + key + '" is not supported by Bridge "' + _this.name);
        }

        return runner.apply(undefined, args);
      };

      if (_this.isReady || !api.isFromBridge) {
        return exec();
      }

      if (_this.runAfterReady) {
        return new Promise(function (resolve) {
          return _this.onReady(function () {
            return resolve(exec());
          });
        });
      } else {
        return console.warn('[Not Ready] Bridge "' + _this.name + '" is not ready, can\'t call Api "' + key + '"');
      }
    };

    this.name = name;
  };

  Bridge.Api = Api;
  Bridge.globalize = globalize;

  exports.default = Bridge;
  exports.Api = Api;
  exports.Bridge = Bridge;
  exports.DynamicFunction = DynamicFunction;
  exports.globalize = globalize;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
