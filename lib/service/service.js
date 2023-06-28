const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')

const log = require('../utils/log')
const { getConfigFilePath, loadModule } = require('../utils/getFile')

class Service {
  constructor(opts) {
    this.args = opts
    this.config = {}
    this.hooks = {}
  }
  start = async () => {
    await this.resolveConfig()
    await this.registerHooks()
    await this.emitHooks('start')
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
  }
  registerHooks = async () => {
    // hook 支持3种的形式
    // 1. hooks: [['start', function(context){}]] [key, 回调]
    // 2. hooks: [['start', '../xx/xx.js']] [key, 要执行的js文件相对路径]
    // 3. hooks: [['start', 'saaa.js']] [key, 要执行的node_modules中文件名]
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
}

module.exports = Service
