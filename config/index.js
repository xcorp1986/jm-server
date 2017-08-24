require('log4js').configure(require('path').join(__dirname, 'log4js.json'))
var config = {
  development: {
    debug: true,
    lng: 'zh_CN',
    port: 3000,
    modules: {
      messages: 'jm-ms-message'
      // config: {
      //     require: ['jm-config'],
      //     proxy: 'ws://localhost:20000/config'
      // }
    }
  },
  production: {
    lng: 'zh_CN',
    port: 3000
  }
}

var env = process.env.NODE_ENV || 'development'
config = config[env] || config['development']
config.env = env

module.exports = config
