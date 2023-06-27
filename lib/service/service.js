const path = require('path')
const fs = require('fs-extra')

const log = require('../utils/log')
const { getConfigFilePath } = require('../utils/getFile')

class Service {
  constructor(opts) {
    this.args = opts
    this.config = {}
    this.hooks = {}
  }
  start = () => {
    console.log('服务启动', this.args)
    this.resolveConfig()
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

      console.log(this.config)
    } else {
      log.error('配置文件不存在')
      process.exit(1)
    }
  }
}

module.exports = Service
