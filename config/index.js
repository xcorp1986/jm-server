var config = {
    development: {
        //mq: 'redis://127.0.0.1',
        port: 21000,
        ms: [
            {
                type: 'ws'
            },
            {
                type: 'http'
            }
        ]
    },
    production: {
        //mq: 'redis://127.0.0.1',
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

['mq'].forEach(function(key) {
    config[key] = process.env[key] || config[key];
});

module.exports = config;
