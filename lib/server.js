'use strict';

var _jmCore = require('jm-core');

var _jmCore2 = _interopRequireDefault(_jmCore);

var _jmLog4js = require('jm-log4js');

var _jmLog4js2 = _interopRequireDefault(_jmLog4js);

var _jmMsCore = require('jm-ms-core');

var _jmMsCore2 = _interopRequireDefault(_jmMsCore);

var _jmMsHttp = require('jm-ms-http');

var _jmMsHttp2 = _interopRequireDefault(_jmMsHttp);

var _jmMsWs = require('jm-ms-ws');

var _jmMsWs2 = _interopRequireDefault(_jmMsWs);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var jm = new _jmCore2.default();
jm.use(_jmLog4js2.default);

var logger = jm.getLogger('jm-server');

var ms = new _jmMsCore2.default();
ms.use(_jmMsHttp2.default.moduleServer).use(_jmMsHttp2.default.moduleClient).use(_jmMsWs2.default.moduleServer).use(_jmMsWs2.default.moduleClient);

module.exports = function (app) {
  var appWeb = null;
  var server = null;

  /**
     * 启动服务器
     * @method server#start
     * 成功响应:
     * doc: 结果true成功 false失败
     * 错误响应:
     * doc: {
     *  err: 错误码,
     *  msg: 错误信息
     * }
     */
  app.open = function (opts, cb) {
    this.emit('beforeOpen', opts);
    opts = opts || {};
    var self = this;
    var config = this.config;
    var root = this.root;
    var servers = this.servers;

    // 启动web模块
    appWeb = (0, _express2.default)();
    var port = config.port || 3000;
    var host = config.host || '0.0.0.0';
    server = _http2.default.createServer(appWeb).listen(port, host, function () {
      logger.info('ms server listening on %s:%s ', host, server.address().port);
    });
    if (config.maxBodySize) {
      appWeb.use(_bodyParser2.default.json({ limit: config.maxBodySize }));
      appWeb.use(_bodyParser2.default.urlencoded({ limit: config.maxBodySize, extended: true }));
    } else {
      appWeb.use(_bodyParser2.default.json());
      appWeb.use(_bodyParser2.default.urlencoded({ extended: true }));
    }
    var trustProxy = false;
    config.trustProxy && (trustProxy = true);
    appWeb.set('trust proxy', trustProxy); // 支持代理后面获取用户真实ip

    // 设置跨域访问
    appWeb.use(function (req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'X-Forwarded-For, X-Requested-With, Content-Type, Content-Length, Authorization, Accept');
      res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
      res.header('Content-Type', 'application/json;charset=utf-8');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    // 启动ms服务器
    var configMS = config.ms || [{
      type: 'ws'
    }, {
      type: 'http'
    }];

    var _loop = function _loop(i) {
      var opts = configMS[i];
      opts.server = server;
      opts.app = appWeb;
      ms.server(root, opts, function (err, doc) {
        if (err) {
          logger.error(err.stack);
          return;
        }
        logger.info('ms server type:%s started', opts.type);
        servers[opts.type] = doc;
        doc.on('connection', function (session) {
          self.emit('connection', session);
        });
      });
    };

    for (var i in configMS) {
      _loop(i);
    }

    if (app.config.lng) {
      var router = _express2.default.Router();
      servers.http.middle = router;
      router.use(function (req, res, next) {
        req.lng = app.config.lng;
        next();
      });
    }

    this.emit('open', opts);
    if (cb) cb(null, true);
    return this;
  };

  /**
     * 停止服务器
     * @method server#stop
     * 成功响应:
     * doc: 结果true成功 false失败
     * 错误响应:
     * doc: {
     *  err: 错误码,
     *  msg: 错误信息
     * }
     */
  app.close = function (opts, cb) {
    this.emit('beforeClose', opts);
    if (server) {
      server.close();
      server = null;
      appWeb = null;
    }
    this.emit('close', opts);
    if (cb) cb(null, true);
    return this;
  };
};