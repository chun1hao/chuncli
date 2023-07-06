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
  constructor(cmd, opts) {
    this.cmd = cmd
    this.args = opts
    this.config = {}
    this.hooks = {}
    this.plugins = []
    this.webpackConfig = null
    // 用于plugins 之间传值
    this.internalValue = {}
    this.isFirstCompile = true
  }
  start = async () => {
    await this.resolveConfig()
    await this.registerHooks()
    await this.emitHooks('registed')
    await this.registerPlugins()
    await this.runPlugin()
    this.startServer()
  }
  build = async () => {
    await this.resolveConfig()
    await this.registerHooks()
    await this.registerPlugins()
    await this.runPlugin()
    this.startBuild()
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
  startServer = async () => {
    await this.emitHooks('unStarted')
    try {
      log.verbose('启动类型', this.args.startType)
      const { startType } = this.args
      let baseConfig
      if (startType === 'vue') {
        baseConfig = require('../config/vue.config')
      } else if (startType === 'react') {
        baseConfig = require('../config/react.config')
      } else {
        log.error(`未知的启动类型 ${chalk.redBright(startType)}`)
        process.exit(1)
      }

      let webpackConfig = merge(
        {
          stats: 'errors-warnings',
          plugins: [
            new webpack.ProgressPlugin({
              activeModules: true,
              entries: true,
              modules: false,
              dependencies: false
            })
          ]
        },
        baseConfig,
        this.config.defineConfig || {},
        this.webpackConfig.toConfig()
      )
      const compiler = this.createCompiler(webpackConfig)

      let devServerConfig = {
        port: this.args.port,
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
      // webpack(config, ()=> {}) 不能加回调或者调用run方法，和webpackdevserver冲突
      compiler = webpack(config)

      // 修改文件之后，webpack重新编译
      compiler.hooks.invalid.tap('invalid', () => {
        clearConsole()
        console.log('Compiling...')
      })

      // 首次编译完成
      compiler.hooks.done.tap('done', async (stats) => {
        await this.emitHooks('started')
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
          clearConsole()
          log.info(
            'SUCCESS',
            'COMPILER SUCCESS',
            chalk.green(`${this.cmd === 'build' ? '打包' : '编译'}成功！`)
          )
          if (this.cmd !== 'build') {
            console.log()
            console.log(`You can now view in the browser.`)
            console.log()
            console.log(
              `  ${chalk.bold('Local:')}            ${chalk.blueBright(
                `http://localhost:${this.args.port}`
              )}/`
            )
            console.log(
              `  ${chalk.bold('On Your Network:')}  ${chalk.blueBright(
                `http://${WebpackDevServer.internalIPSync('v4')}:${
                  this.args.port
                }/`
              )}`
            )
          }
        }
      })
    } catch (err) {
      log.error('COMPILER ERROR', err.message || err)
      process.exit(1)
    }
    return compiler
  }
  startBuild = async () => {
    try {
      log.verbose('打包类型', this.args.startType)
      const { startType } = this.args
      let baseConfig
      if (startType === 'vue') {
        baseConfig = require('../config/vue.config')
      } else if (startType === 'react') {
        baseConfig = require('../config/react.config')
      } else {
        log.error(`未知的打包类型 ${chalk.redBright(startType)}`)
        process.exit(1)
      }

      let webpackConfig = merge(
        {
          stats: 'errors-warnings',
          plugins: [
            new webpack.ProgressPlugin({
              activeModules: true,
              entries: true,
              modules: false,
              dependencies: false
            })
          ]
        },
        baseConfig,
        this.config.defineConfig || {},
        this.webpackConfig.toConfig()
      )
      let compiler = this.createCompiler(webpackConfig)
      compiler.run()
    } catch (e) {
      log.error(e.message || e)
      process.exit(1)
    }
  }
}

module.exports = Service
