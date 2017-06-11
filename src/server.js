import JM from 'jm-core';
import moduleLog4js from 'jm-log4js';
import MS from 'jm-ms-core';
import msHttp from 'jm-ms-http';

import http from 'http';
import https from 'https';
import express from 'express';
import bodyParser from 'body-parser';

let jm = new JM();
jm.use(moduleLog4js);

let logger = jm.getLogger('jm-server');

let ms = new MS();
ms
    .use(msHttp.moduleServer)
    .use(msHttp.moduleClient)
;

module.exports = function (app) {
    let appWeb = null;
    let server = null;

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
        let self = this;
        let config = this.config;
        let root = this.root;
        let servers = this.servers;

        //启动web模块
        appWeb = express();
        let port = config.port || 3000;
        let host = config.host || '0.0.0.0';
        server = http.createServer(appWeb).listen(port, host, function () {
            logger.info('ms server listening on %s:%s ', host, server.address().port);
        });
        if (config.maxBodySize) {
            appWeb.use(bodyParser.json({limit: config.maxBodySize}));
            appWeb.use(bodyParser.urlencoded({limit: config.maxBodySize, extended: true}));
        } else {
            appWeb.use(bodyParser.json());
            appWeb.use(bodyParser.urlencoded({extended: true}));
        }
        let trustProxy = false;
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

        //启动ms服务器
        let config_ms = config.ms || [
                {
                    type: 'ws'
                },
                {
                    type: 'http'
                }
            ];
        for (let i in config_ms) {
            let opts = config_ms[i];
            opts.server = server;
            opts.app = appWeb;
            ms.server(root, opts, function (err, doc) {
                if(err) {
                    logger.error(err.stack);
                    return;
                }
                logger.info('ms server type:%s started', opts.type);
                servers[opts.type] = doc;
                doc.on('connection', function (session) {
                    self.emit('connection', session);
                });
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
    }
};
