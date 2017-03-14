#!/usr/bin/env node

'use strict';
var colors = require('colors'),
    os = require('os'),
    fs = require('fs'),
    path = require('path'),
    argv = require('yargs')
        .alias('c', 'config')
        .alias('p', 'port')
        .alias('a', 'host')
        .alias('f', 'prefix')
        .alias('d', 'debug')
        .alias('t', 'trustProxy')
        .alias('l', 'lng')
        .alias('D', 'daemon')
        .argv;

var root = argv._[0];
if (root && !path.isAbsolute(root)) {
    root = path.join(process.cwd(), root);
}
root || (root = process.cwd());

configure();

var config = null;
function configure() {
    var configFile = argv.c;
    if (configFile && !path.isAbsolute(configFile)) {
        configFile = path.join(root, configFile);
    }
    configFile || (configFile = path.join(root, '/config'));
    fs.access(configFile, fs.constants.R_OK, function (err) {
        if (!err) {
            if(argv.production) process.env.NODE_ENV = 'production';
            config = require(configFile);
        } else {
            console.warn('no config file found %s'.red, configFile);
        }
        config || (config = {});
        ['host', 'port', 'debug', 'prefix', 'trustProxy', 'lng'].forEach(function(key) {
            argv[key] && (config[key] = argv[key]);
        });
        start_app();
    });
};

function start_app() {
    require('../lib')(config);
};

function stop_app() {
    console.log('jm-server stopped.'.red);
    process.exit();
};

process.on('SIGINT', function () {
    stop_app();
});

process.on('SIGTERM', function () {
    stop_app();
});

process.on('uncaughtException', function (err) {
    console.error('Caught exception: ' + err.stack);
});
