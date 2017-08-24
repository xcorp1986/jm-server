'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _jmCore = require('jm-core');

var _jmCore2 = _interopRequireDefault(_jmCore);

var _jmLog4js = require('jm-log4js');

var _jmLog4js2 = _interopRequireDefault(_jmLog4js);

var _jmMs = require('jm-ms');

var _jmMs2 = _interopRequireDefault(_jmMs);

var _help = require('./help');

var _help2 = _interopRequireDefault(_help);

var _module = require('./module');

var _module2 = _interopRequireDefault(_module);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var jm = new _jmCore2.default();
jm.use(_jmLog4js2.default);

var ms = (0, _jmMs2.default)();
var logger = jm.getLogger('jm-server');

/**
 * server
 * @class server
 * @param {Object} [opts={}] 参数
 * @example
 * opts参数:{
     *  modules: (模块)
     * }
 * @returns {Object}
 * @example
 * 返回结果: server对象
 */
var server = function server() {
  var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var config = opts;
  ['host', 'port', 'debug', 'prefix', 'trustProxy', 'lng', 'disableAutoInit', 'disableAutoOpen', 'maxBodySize'].forEach(function (key) {
    process.env[key] && (config[key] = process.env[key]);
  });
  if (config.debug) {
    logger.debug('config: %s', jm.utils.formatJSON(config));
  }

  var app = {
    config: config,

    clear: function clear() {
      this.root = ms.router();
      this.router = ms.router();
      this.moduleConfigs = {};
      this.modules = {};
      this.routers = {};
      this.servers = {};
    },

    init: function init(opts, cb) {
      this.clear();
      this.emit('init', opts);
      if (config.lng) {
        this.root.use(config.prefix || '', function (opts, cb, next) {
          opts.lng = config.lng;
          next();
        });
      }
      (0, _help2.default)(this);
      if (config.modules) app.uses(config.modules);
      this.emit('uses', this);
      (0, _module2.default)(this);
      this.root.use(config.prefix || '', this.router);
      if (cb) cb(null, true);
      return this;
    },

    /**
         * 添加模块
         * 支持多种参数格式, 例如
         * use(name, {module:module})
         * use(name, module)
         * @function server#use
         * @param {String} name 模块名称
         * @param {Object} opts 参数
         * @example
         * opts参数:
         * 'jm-config'
         * 或者对象
         * {
         *  module: jm-config(必填)
         * }
         * 或者代理
         * {
         *  proxy: uri(必填)
         * }
         * @returns {Object}
         */
    use: function use(name, opts) {
      opts || (opts = {});
      if (typeof opts === 'string') {
        opts = { module: opts };
      }

      if (opts.require) {
        var v = opts.require;
        if (typeof v === 'string') v = [v];
        for (var k in v) {
          require(v[k]);
        }
      }

      var module = null;
      var router = null;
      if (opts.proxy) {
        router = ms.router();
        module = router;
        router.proxy('/', opts.proxy, function (err, doc) {
          if (err) {
            return logger.warn('proxy failed. %j\nreturn: %j\n%s', opts, doc || '', err.stack);
          }
        });
      } else {
        opts.module || (opts.module = name);
        if (!opts.module && !opts.require) {
          logger.warn('use failed. %s: %j', name, opts);
          return this;
        }
        var Module = require(opts.module);
        if (typeof Module === 'function') {
          module = Module.call(app, opts.config || config, app);
        } else {
          module = Module;
        }

        if (module) {
          if (module.request || module.handle) {
            router = module;
          } else if (module.router && !opts.noRouter) {
            router = module.router();
          }
        }
      }

      name || (name = '');
      if (router) {
        var prefix = '/' + name;
        opts.config && opts.config.prefix && (prefix = opts.config.prefix);
        opts.prefix && (prefix = opts.prefix);
        this.router.use(prefix, router);
      }

      this.moduleConfigs[name] = opts;
      this.modules[name] = module;
      this.routers[name] = router;
      logger.info('use ok. %s: %j', name, opts);
      return this;
    },

    /**
         * 添加多个模块
         * @function server#uses
         * @param {Object} opts 参数
         * @example
         * opts参数:{
             *  : {module: 'jm-ms-message'},
             *  config: jm-config,
             *  config1: jm-config1
             * }
         * @returns {Object}
         */
    uses: function uses(opts) {
      for (var name in opts) {
        this.use(name, opts[name]);
      }
      return this;
    },

    unuse: function unuse(name) {
      var r = this.routers[name];
      this.modules[name] = null;
      this.routers[name] = null;
      if (r) r.clear();
    }
  };
  jm.enableEvent(app);

  require('./server')(app);
  if (!opts.disableAutoInit) app.init();
  if (!opts.disableAutoOpen) app.open();
  return app;
};
jm.enableEvent(server);

exports.default = server;
module.exports = exports['default'];