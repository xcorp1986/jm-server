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

var config = null;
configure();
module.exports = start_app();

function configure() {
    var configFile = argv.c;
    if (configFile && !path.isAbsolute(configFile)) {
        configFile = path.join(root, configFile);
    }
    configFile || (configFile = path.join(root, '/config'));

    if(argv.production) process.env.NODE_ENV = 'production';
    try {
        fs.accessSync(configFile, fs.constants.R_OK);
        config = require(configFile);
    }
    catch (e) {
        console.warn('no config file found %s'.red, configFile);
    }
    config || (config = {});
    ['host', 'port', 'debug', 'prefix', 'trustProxy', 'lng', 'maxBodySize'].forEach(function(key) {
        argv[key] && (config[key] = argv[key]);
    });
};

function start_app() {
    return require('../lib')(config);
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
