const path = require('path')
const cp = require('child_process')
const chokidar = require('chokidar')

const log = require('../utils/log')
const { getConfigFilePath } = require('../utils/getFile')
const { DEFAULT_PORT } = require('../constant/index')

let child
let originOpts = {}
let childPortChoice = '0'
// 端口占用  '0'：询问； '1': 启用新端口

// 监听配置文件
function watchServer(opts = originOpts) {
  const { config = '' } = opts
  const watchPath = getConfigFilePath(config)
  chokidar
    .watch(watchPath)
    .on('change', onChange)
    .on('error', (err) => {
      log.error(err)
      process.exit(1)
    })
}
function onChange() {
  // 配置文件修改，重启
  child.kill()
  runServer()
}

// 子进程启动服务
function runServer(opts = originOpts) {
  const { config = '', port = DEFAULT_PORT } = opts
  const scriptPath = path.resolve(__dirname, './devServer.js')
  child = cp.fork(scriptPath, [
    '--port ' + port,
    '--config ' + config,
    '--childPortChoice ' + childPortChoice
  ])

  // 监听子进程，如果子进程退出，也要结束主进程
  child.on('exit', (code) => {
    code && process.exit(code)
  })

  child.on('message', (d) => {
    childPortChoice = d.choicePort
  })
}

module.exports = function (opts) {
  originOpts = opts
  runServer(originOpts)
  watchServer(originOpts)
}
