var jm = require('jm-ms');
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');

if (jm.server) return;
var ERR = jm.ERR;
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
jm.server = function (opts) {
    opts = opts || {};
    var config = opts;
    ['port', 'debug', 'prefix', 'trustProxy', 'lng'].forEach(function(key) {
        process.env[key] && (config[key] = process.env[key]);
    });
    var ms = jm.ms;
    var app = ms();
    app.config = config;
    app.modules = {};
    app.routers = {};

    app.start = function(cb) {
        var self = this;

        //启动web模块
        var appWeb = express();
        var server = http.createServer(appWeb).listen(config.port || 3000, function () {
            logger.info("ms server listening on port " + server.address().port);
        });
        appWeb.use(bodyParser.json());
        appWeb.use(bodyParser.urlencoded({extended: true}));
        var trustProxy = false;
        config.trustProxy && (trustProxy = true);
        appWeb.set('trust proxy', trustProxy);   //支持代理后面获取用户真实ip

        //设置跨域访问
        appWeb.use(function (req, res, next) {
            res.header('Access-Control-Allow-Origin', '*');
            res.header('Access-Control-Allow-Headers', 'X-Forwarded-For, X-Requested-With, Content-Type, Content-Length, Authorization, Accept');
            res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');
            res.header('Content-Type', 'application/json;charset=utf-8');
            if (req.method == 'OPTIONS')
                res.sendStatus(200);
            else
                next();
        });

        self.servers = {};

        var config_ms = config.ms || [
                {
                    type: 'ws'
                },
                {
                    type: 'http'
                }
            ];
        for (var i in config_ms) {
            var opts = config_ms[i];
            opts.server = server;
            opts.app = appWeb;
            ms.server(app, opts, function (err, doc) {
                logger.info('ms server type:%s started', opts.type);
                app.servers[opts.type] = doc;
                doc.on('connection', function (session) {
                    app.emit('connection', session);
                });
            });
        }
    };

    var router = jm.ms();
    jm.server.emit('beforeLoadModules', router, opts, app);
    app.use(config.prefix || '', router);

    router.add('/', 'get', function(opts, cb, next){
        opts.help || (opts.help = {});
        var modules = {};
        var status = 1;
        for(var key in app.modules){
            var module = app.modules[key];
            modules[key] = 1;
            if(module.ready === undefined ) continue;
            if(!module.ready) {
                modules[key] = 0;
                status = 0;
            }
        }
        opts.help.status = status;
        opts.help.modules = modules;
        next();
    });

    /**
     * 添加模块
     * 支持多种参数格式, 例如
     * loadModule(name, {module:module})
     * loadModule(name, module)
     * @function server#loadModule
     * @param {String} name 模块名称
     * @param {Object} opts 参数
     * @example
     * opts参数:
     * 'jm-config'
     * 或者对象
     * {
     *  module: jm-config(必填)
     * }
     * @returns {Object}
     */
    app.loadModule = function (name, opts) {
        opts || (opts={});
        if(typeof opts === 'string') {
            opts = {module: opts};
        }
        if (!opts.module) {
            logger.warn('loadModule failed. %s: %j', name, opts);
            return this;
        }
        name || (name = '');
        var uri = '/' + name;
        if(opts.plugins) {
            for(var key in opts.plugins) {
                var module = opts.plugins[key];
                require(module);
                logger.info('load plugin for %s for module %s', module, name);
            }
        }
        var module = require(opts.module)(opts.config || config, app);
        var _router = null;
        if(module instanceof jm.ms.Router){
            _router = module;
        }else if(module.router){
            _router = module.router();
        }
        if(_router){
            var prefix = '/' + name;
            opts.config && opts.config.prefix && (prefix = opts.config.prefix);
            router.use(prefix, _router);
        }
        app.modules[name] = module;
        app.routers[name] = _router;
        logger.info('loadModule ok. %s: %j', name, opts);
        return this;
    };

    /**
     * 添加多个模块
     * @function server#loadModules
     * @param {Object} opts 参数
     * @example
     * opts参数:{
         *  : {module: 'jm-ms-message'},
         *  config: jm-config,
         *  config1: jm-config1
         * }
     * @returns {Object}
     */
    app.loadModules = function (opts) {
        for (var name in opts) {
            this.loadModule(name, opts[name]);
        }
        return this;
    };

    app.unloadModule = function(name) {
        var m = this.modules[name];
        var r = this.routers[name];
        this.modules[name] = null;
        this.routers[name] = null;
        if(r) r.clear();
    };

    (function(){
        var r = ms();
        r.add('/', 'get', function(opts, cb, next){cb(null, {ret: Object.keys(app.modules)})});
        r.add('/:name', 'delete', function(opts, cb, next){app.unloadModule(opts.params.name); cb(null, {ret: true})});
        router.use('/modules', r);
    })();

    if (opts.modules) app.loadModules(opts.modules);
    jm.server.emit('afterLoadModules', router, opts);

    if(!opts.disableAutoStart) app.start();
    return app;
};
jm.enableEvent(jm.server);

