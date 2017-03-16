require('log4js').configure(__dirname + '/log4js.json');
var config = {
    development: {
        debug: true,
        port: 21000,
        modules: {
            i18next: process.cwd() + '/locales',
            messages: 'jm-ms-message',
            config: {
                require: ['jm-config'],
                proxy: 'ws://localhost:20000/config'
            }
        }
    },
    production: {
        port: 21000
    }
};

var env = process.env.NODE_ENV ||'development';
config = config[env]||config['development'];
config.env = env;

module.exports = config;
