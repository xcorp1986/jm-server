#!/usr/bin/env node

'use strict';
var colors = require('colors'),
    os = require('os'),
    fs = require('fs'),
    path = require('path'),
    argv = require('yargs')
        .alias('v', 'version')
        .alias('h', 'help')
        .alias('c', 'config')
        .alias('p', 'port')
        .alias('a', 'host')
        .alias('f', 'prefix')
        .alias('d', 'debug')
        .alias('t', 'trustProxy')
        .alias('l', 'lng')
        .argv;

if(argv.v) {
    require('jm-ms-help');
    jm.ms.help({}, function (err, doc) {
        console.log('%j', doc);
    });
    return;
}

if (argv.h || argv.help) {
    console.log([
        'usage: jm-server [path] [options]',
        '',
        'options:',
        '  -v --version Version info.',
        '  -c --config  config file.',
        '  -p --port    Port to use [3000]',
        '  -a --host    Address to use [0.0.0.0]',
        '  -f --prefix  Uri prefix []',
        '  -d --debug   Debug mode [false]',
        '  -t --trustProxy  trustProxy [false]',
        '  -l --lng     language [zh]',
        '  --production set NODE_ENV to production',
        '  --cluster    run in cluster mode',
        '',
        '  -U --utc     Use UTC time format in log messages.',
        '',
        '  -S --ssl     Enable https.',
        '  -C --cert    Path to ssl cert file (default: cert.pem).',
        '  -K --key     Path to ssl key file (default: key.pem).',
        '',
        '  -h --help    Print this list and exit.'
    ].join('\n'));
    process.exit();
}

var root = argv._[0];
if (root && !path.isAbsolute(root)) {
    root = path.join(process.cwd(), root);
}
root || (root = process.cwd());

configure();

var config = {};
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
        }
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
