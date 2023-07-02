const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const webpack = require('webpack')
const WebpackChain = require('webpack-chain')
const { merge } = require('webpack-merge')
const WebpackDevServer = require('webpack-dev-server')

const log = require('../utils/log')
const { getConfigFilePath, loadModule } = require('../utils/getFile')
const clearConsole = require('../utils/clearConsole')

class Service {
  constructor(opts) {
    this.args = opts
    this.config = {}
    this.hooks = {}
    this.plugins = []
    this.webpackConfig = null
    // 用于plugins 之间传值
    this.internalValue = {}
  }
  start = async () => {
    await this.resolveConfig()
    await this.registerHooks()
    await this.emitHooks('start')
    await this.registerPlugins()
    this.startServer()
  }
  resolveConfig = async () => {
    const { config } = this.args
    let configFilePath = getConfigFilePath(config)
    if (configFilePath && fs.existsSync(configFilePath)) {
      if (configFilePath.endsWith('mjs')) {
        this.config = (await import('file://' + configFilePath)).default
      } else {
        this.config = require(configFilePath)
      }
    } else {
      log.error('配置文件不存在')
      process.exit(1)
    }

    this.webpackConfig = new WebpackChain()
  }
  registerHooks = async () => {
    // hook 支持3种的形式
    // 1. hooks: [['start', function(context){}]] [key, 回调]
    // 2. hooks: [['start', '../xx/xx.js']] [key, 要执行的js文件相对路径]
    // 3. hooks: [['start', 'saaa.js']] [key, 要执行的node_modules中文件名]
    // 自定义hook可以在插件通过emitHooks触发
    const { hooks = [] } = this.config
    if (hooks && hooks.length) {
      for (const hook of hooks) {
        const [key, fn] = hook
        if (key && fn && typeof key === 'string') {
          if (!this.hooks[key]) this.hooks[key] = []
          if (typeof fn === 'function') {
            this.hooks[key].push(fn)
          } else if (typeof fn === 'string') {
            const hookFn = await loadModule(fn)
            if (hookFn) {
              this.hooks[key].push(hookFn)
            }
          }
        }
      }
    }
  }
  emitHooks = async (key) => {
    const hooks = this.hooks[key]
    if (hooks) {
      for (let fn of hooks) {
        try {
          await fn(this)
        } catch (e) {
          log.error(`触发hook ${chalk.red(key)} 出错：${chalk.red(e)}`)
        }
      }
    }
  }
  registerPlugins = async () => {
    // plugin 支持形式
    // 1. plugins: ['pluginName']
    // 2. plugins: [['pluginName'], ['pluginName', {a: 1, b: 2}], ['./pluginName'], ['./pluginName', {a: 1, b: 2}]]
    // 3. plugins: [function(){}]
    let plugins = this.config.plugins
    if (plugins) {
      for (let item of plugins) {
        if (typeof item === 'string') {
          let mod = await loadModule(pluginPath)
          this.plugins.push({ mod })
        } else if (Array.isArray(item)) {
          let [pluginPath, params = {}] = item
          if (typeof pluginPath === 'string') {
            let mod = await loadModule(pluginPath)
            this.plugins.push({ mod, params })
          }
        } else if (typeof item === 'function') {
          this.plugins.push({ mod: item })
        }
      }
    }
  }
  runPlugin = async () => {
    for (const plugin of this.plugins) {
      const { mod, params = {} } = plugin
      if (!mod) continue
      const API = {
        getWebpackConfig: this.getWebpackConfig,
        getVal: this.getVal,
        setVal: this.setVal,
        emitHooks: this.emitHooks
      }
      await mod({ API, params })
    }
  }
  getWebpackConfig = () => {
    return this.webpackConfig
  }
  setVal = (key, value) => {
    this.internalValue[key] = value
  }
  getVal = (key) => {
    return this.internalValue[key]
  }
  startServer = () => {
    try {
      let webpackConfig = merge(this.webpackConfig.toConfig(), this.config)
      const compiler = this.createCompiler(webpackConfig)

      let devServerConfig = {
        port: this.args.port || '8080',
        host: '0.0.0.0',
        https: false
      }
      const devServer = new WebpackDevServer(devServerConfig, compiler)

      devServer.startCallback(() => {})
    } catch (e) {
      log.error(e.message || e)
      process.exit(1)
    }
  }
  createCompiler = (config) => {
    let compiler
    try {
      // webpack(config, ()=> {}) 不能加回调，会报错？
      compiler = webpack(config)

      // 修改文件之后，webpack重新编译
      compiler.hooks.invalid.tap('invalid', () => {
        clearConsole()
        console.log('Compiling...')
      })

      // 首次编译完成
      compiler.hooks.done.tap('done', (stats) => {
        const res = stats.toJson({
          all: false,
          warnings: true,
          errors: true
        })

        if (res.errors && res.errors.length > 0) {
          log.error('COMPILER ERROR')
          res.errors.forEach((error) => {
            log.error('ERROR', error.message)
          })
        } else if (res.warnings && res.warnings.length > 0) {
          log.warn('COMPILER WARRING')
          res.warnings.forEach((warn) => {
            log.warn('WARNING', warn.message)
          })
        } else {
          log.info('SUCCESS', 'COMPILER SUCCESS', chalk.green('编译成功！'))
        }
      })
    } catch (err) {
      log.error('COMPILER ERROR', err.message || err)
      process.exit(1)
    }
    return compiler
  }
}

module.exports = Service
