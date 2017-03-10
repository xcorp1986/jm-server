var config = {
    development: {
        debug: true,
        port: 21000,
        ms: [
            {
                type: 'ws'
            },
            {
                type: 'http'
            }
        ],
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
        port: 21000,
        ms: [
            {
                type: 'ws'
            },
            {
                type: 'http'
            }
        ]
    }
};

var env = process.env.NODE_ENV||'development';
config = config[env]||config['development'];
config.env = env;

['port', 'debug', 'prefix', 'trustProxy', 'lng'].forEach(function(key) {
    config[key] = process.env[key] || config[key];
});

module.exports = config;
