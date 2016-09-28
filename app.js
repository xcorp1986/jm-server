var log4js = require('log4js');
log4js.configure('./config/log4js.json');
var config = require('./config');
var jm = require('jm-ms');
var logger = jm.getLogger('main');
var express = require('express');
var http = require('http');
var bodyParser = require('body-parser');

//启动web服务
var appWeb = express();
var server = http.createServer(appWeb).listen(config.port || 3000, function () {
    logger.info("ms server listening on port " + server.address().port);
});
appWeb.use(bodyParser.json());
appWeb.use(bodyParser.urlencoded({extended: true}));
appWeb.set('trust proxy', true);   //支持代理后面获取用户真实ip

//设置跨域访问
appWeb.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Content-Length, Authorization, Accept');
    res.header('Access-Control-Allow-Methods','PUT, POST, GET, DELETE, OPTIONS');
    res.header('Content-Type', 'application/json;charset=utf-8');
    if(req.method=='OPTIONS')
        res.sendStatus(200);
    else
        next();
});

//启动ms服务
var ms = jm.ms;
var app = ms();
app.servers = {};
app.config = config;
var service = require('./lib')(config);
app.use(config.prefix || '', service.router());
service.app = app;
for(var i in config.ms){
    var opts = config.ms[i];
    opts.server = server;
    opts.app = appWeb;
    ms.server(app, opts, function (err, doc) {
        logger.info('ms server type:%s started', opts.type);
        app.servers[opts.type] = doc;
        doc.on('connection', function(session){
            service.emit('connection', session);
        });
    });
}

process.on('uncaughtException', function (err) {
    console.error('Caught exception: ' + err.stack);
});
