import proxy from 'http-proxy-middleware'
import express from 'express'
import event from 'jm-event'
import log from 'jm-log4js'
import util from 'jm-utils'
import _ms from 'jm-ms'
import routerHelp from './help'
import routerModule from './module'

let ms = _ms()
let logger = log.getLogger('jm-server')

/**
 * server
 * @class server
 * @param {Object} [opts={}] 参数
 * @example
 * opts参数:{
 *  modules: (模块)
 * }
 * @returns {Object}
 * @example
 * 返回结果: server对象
 */
let server = function (opts = {}) {
  let config = opts
  const v = ['host', 'port', 'debug', 'prefix', 'trust_proxy', 'lng', 'no_auto_init', 'no_auto_open', 'max_body_size']
  v.forEach(function (key) {
    process.env[key] && (config[key] = process.env[key])
  })

  // ---- deprecated begin ----
  const o = {
    disableAutoInit: 'no_auto_init',
    disableAutoOpen: 'no_auto_open',
    maxBodySize: 'max_body_size',
    trustProxy: 'trust_proxy'
  }
  Object.keys(o).forEach(function (key) {
    if (process.env[key]) {
      config[o[key]] = process.env[key]
      logger.warn(`${key} deprecated, please use ${o[key]}`)
    }
  })
  // ---- deprecated end ----

  let app = {
    config: config,

    clear: function () {
      this.root = ms.router()
      this.router = ms.router()
      this.httpProxyRouter = express.Router()
      this.moduleConfigs = {}
      this.modules = {}
      this.routers = {}
      this.servers = {}
    },

    init: function (opts, cb) {
      this.clear()
      this.emit('init', opts)
      if (config.lng) {
        this.root.use(config.prefix || '', function (opts, cb, next) {
          opts.lng = config.lng
          next()
        })
      }
      if (!config.trust_proxy) {
        this.root.use(function (opts, cb, next) {
          if (opts.headers && opts.headers['x-forwarded-for']) {
            delete opts.headers['x-forwarded-for']
          }
          next()
        })
      }
      if (config.debug) {
        this.root.use(function (opts, cb, next) {
          logger.debug('request: %j', opts)
          next()
        })
      }
      routerHelp(this)
      if (config.modules) app.uses(config.modules)
      this.emit('uses', this)
      routerModule(this)
      this.root.use(config.prefix || '', this.router)
      if (cb) cb(null, true)
      return this
    },

    /**
     * 添加模块
     * 支持多种参数格式, 例如
     * use(name, {module:module})
     * use(name, module)
     * @function server#use
     * @param {String} name 模块名称
     * @param {Object} opts 参数
     * @example
     * opts参数:
     * 'jm-config'
     * 或者对象
     * {
     *  module: jm-config(必填)
     * }
     * 或者代理
     * {
     *  proxy: uri(必填)
     * }
     * @returns {Object}
     */
    use: function (name = '', opts = {}) {
      if (typeof opts === 'string') {
        opts = {module: opts}
      }

      if (opts.require) {
        let v = opts.require
        if (typeof v === 'string') v = [v]
        for (let k in v) {
          require(v[k])
        }
      }

      let module = null
      let router = null

      if (opts.httpProxy) {
        let changeOrigin = true
        if (opts.changeOrigin !== undefined) changeOrigin = opts.changeOrigin
        let options = {
          target: opts.httpProxy,
          changeOrigin: changeOrigin, // needed for virtual hosted sites
          onProxyReq: function (proxyReq, req, res) {
          },
          onProxyRes: function (proxyRes, req, res) {
          }
        }
        let prefix = '/' + name
        router = express.Router()
        router.use(proxy(opts.prefix || prefix, options))
        this.httpProxyRouter.use(router)
        module = router
      } else {
        if (opts.proxy) {
          router = ms.router()
          module = router
          router.proxy('/', opts.proxy, function (err, doc) {
            if (err) {
              return logger.warn('proxy failed. %j\nreturn: %j\n%s', opts, doc || '', err.stack)
            }
          })
        } else {
          opts.module || (opts.module = name)
          if (!opts.module && !opts.require) {
            logger.warn('use failed. %s: %j', name, opts)
            return this
          }
          let Module = require(opts.module)
          if (typeof Module === 'function') {
            module = Module.call(app, opts.config || config, app)
          } else {
            module = Module
          }

          if (module) {
            if (module.request || module.handle) {
              router = module
            } else if (module.router && !opts.noRouter) {
              router = module.router()
            }
          }
        }

        if (router) {
          let prefix = '/' + name
          opts.config && opts.config.prefix && (prefix = opts.config.prefix)
          opts.prefix && (prefix = opts.prefix)
          this.router.use(prefix, router)
        }
      }

      this.moduleConfigs[name] = opts
      this.modules[name] = module
      this.routers[name] = router
      logger.info('use ok. %s: %j', name, opts)
      return this
    },

    /**
     * 添加多个模块
     * @function server#uses
     * @param {Object} opts 参数
     * @example
     * opts参数:{
     *  : {module: 'jm-ms-message'},
     *  config: jm-config,
     *  config1: jm-config1
     * }
     * @returns {Object}
     */
    uses: function (opts) {
      for (let name in opts) {
        this.use(name, opts[name])
      }
      return this
    },

    unuse: function (name) {
      let r = this.routers[name]
      this.modules[name] = null
      this.routers[name] = null
      if (r) r.clear()
    }
  }
  event.enableEvent(app)

  require('./server')(app)
  if (!opts.no_auto_init) app.init()
  if (!opts.no_auto_open) app.open()
  if (config.debug) {
    logger.debug('config: %s', util.utils.formatJSON(config))
  }
  return app
}
event.enableEvent(server)

export default server
