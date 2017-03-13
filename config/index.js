require('log4js').configure(__dirname + '/log4js.json');
var config = {
    development: {
        debug: true,
        port: 21000,
        modules: {
            '': {
                module: 'jm-ms-message'
            },
            config: {
                module: 'jm-config',
                plugins: [],
                config: {
                }
            },
            sdk: {
                module: './sdk'
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
