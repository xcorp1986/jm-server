'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _httpProxyMiddleware = require('http-proxy-middleware');

var _httpProxyMiddleware2 = _interopRequireDefault(_httpProxyMiddleware);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _jmEvent = require('jm-event');

var _jmEvent2 = _interopRequireDefault(_jmEvent);

var _jmLog4js = require('jm-log4js');

var _jmLog4js2 = _interopRequireDefault(_jmLog4js);

var _jmUtils = require('jm-utils');

var _jmUtils2 = _interopRequireDefault(_jmUtils);

var _jmMs = require('jm-ms');

var _jmMs2 = _interopRequireDefault(_jmMs);

var _help = require('./help');

var _help2 = _interopRequireDefault(_help);

var _module = require('./module');

var _module2 = _interopRequireDefault(_module);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ms = (0, _jmMs2.default)();
var logger = _jmLog4js2.default.getLogger('jm-server');

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
  var v = ['host', 'port', 'debug', 'prefix', 'trust_proxy', 'lng', 'no_auto_init', 'no_auto_open', 'max_body_size'];
  v.forEach(function (key) {
    process.env[key] && (config[key] = process.env[key]);
  });

  // ---- deprecated begin ----
  var o = {
    disableAutoInit: 'no_auto_init',
    disableAutoOpen: 'no_auto_open',
    maxBodySize: 'max_body_size',
    trustProxy: 'trust_proxy'
  };
  Object.keys(o).forEach(function (key) {
    var bWarn = false;
    if (config[key] !== undefined) {
      config[o[key]] = config[key];
      delete config[key];
      bWarn = true;
    }
    if (process.env[key]) {
      config[o[key]] = process.env[key];
      bWarn = true;
    }
    bWarn && logger.warn(key + ' deprecated, please use ' + o[key]);
  });
  // ---- deprecated end ----

  var app = {
    config: config,

    clear: function clear() {
      this.root = ms.router();
      this.router = ms.router();
      this.httpProxyRouter = _express2.default.Router();
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
      if (!config.trust_proxy) {
        this.root.use(function (opts, cb, next) {
          if (opts.headers && opts.headers['x-forwarded-for']) {
            delete opts.headers['x-forwarded-for'];
          }
          next();
        });
      }
      if (config.debug) {
        this.root.use(function (opts, cb, next) {
          logger.debug('request: %j', opts);
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
    use: function use() {
      var name = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
      var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

      if (typeof opts === 'string') {
        opts = { module: opts };
      }

      if (opts.require) {
        var _v = opts.require;
        if (typeof _v === 'string') _v = [_v];
        for (var k in _v) {
          require(_v[k]);
        }
      }

      var module = null;
      var router = null;

      if (opts.httpProxy) {
        var changeOrigin = true;
        if (opts.changeOrigin !== undefined) changeOrigin = opts.changeOrigin;
        var options = {
          target: opts.httpProxy,
          changeOrigin: changeOrigin, // needed for virtual hosted sites
          onProxyReq: function onProxyReq(proxyReq, req, res) {},
          onProxyRes: function onProxyRes(proxyRes, req, res) {}
        };
        var prefix = '/' + name;
        router = _express2.default.Router();
        router.use((0, _httpProxyMiddleware2.default)(opts.prefix || prefix, options));
        this.httpProxyRouter.use(router);
        module = router;
      } else {
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

        if (router) {
          var _prefix = '/' + name;
          opts.config && opts.config.prefix && (_prefix = opts.config.prefix);
          opts.prefix && (_prefix = opts.prefix);
          this.router.use(_prefix, router);
        }
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
  _jmEvent2.default.enableEvent(app);

  require('./server')(app);
  if (!opts.no_auto_init) app.init();
  if (!opts.no_auto_open) app.open();
  if (config.debug) {
    logger.debug('config: %s', _jmUtils2.default.utils.formatJSON(config));
  }
  return app;
};
_jmEvent2.default.enableEvent(server);

exports.default = server;
module.exports = exports['default'];