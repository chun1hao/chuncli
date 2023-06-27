const path = require('path')
const fg = require('fast-glob')

const { DEFAULT_CONFIG_FILE } = require('../constant/index')

function getConfigFilePath(configPath) {
  let filePath = ''
  if (configPath) {
    // 如果指定了配置文件
    if (path.isAbsolute(configPath)) {
      filePath = configPath
    } else {
      // 没有指定，查找文件夹中chun.config的文件，并返回绝对路径
      filePath = path.resolve(configPath)
    }
  } else {
    const [configFilePath] = fg.sync(DEFAULT_CONFIG_FILE, { absolute: true })
    filePath = configFilePath
  }
  return filePath
}

module.exports = {
  getConfigFilePath
}
