const path = require('path')
const fs = require('fs-extra')
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

async function loadModule(modulePath) {
  let fnPath = ''
  if (modulePath) {
    if (modulePath.startsWith('/') || modulePath.startsWith('.')) {
      fnPath = path.isAbsolute(modulePath)
        ? modulePath
        : path.resolve(modulePath)
    } else {
      fnPath = require.resolve(modulePath, {
        paths: [path.resolve(process.cwd(), 'node_modules')]
      })
    }

    if (fs.existsSync(fnPath)) {
      let fn
      if (fnPath.endsWith('mjs')) {
        fn = (await import(fnPath)).default
      } else {
        fn = require(fnPath)
      }
      return fn
    }
  }
  return null
}

module.exports = {
  getConfigFilePath,
  loadModule
}
