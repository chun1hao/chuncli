#!/usr/bin/env node
const program = require('commander')
const chalk = require('chalk')
const figlet = require('figlet')

const pk = require('../package.json')
const { THRESHOLD } = require('../lib/constant')
const enhanceErrorMessage = require('../lib/utils/enhanceErrorMessage')
const log = require('../lib/utils/log')
const { suggestCommands } = require('../lib/utils/index')
const create = require('../lib/create/create')

program
  .name('chbuild')
  .description('一个脚手架')
  .version(pk.version, '-v, --version')

program
  .command('create')
  .description('创建一个模版项目')
  .argument('<templateName>', '模版类型')
  .argument('<projectName>', '项目名称')
  .option('-f, --force', '存在同名文件夹强制覆盖')
  .action((templateName, projectName, option) => {
    create(templateName, projectName, option)
  })

// 非法命令处理
program.arguments('<command>').action((cmd) => {
  program.outputHelp()
  console.log()
  log.error(chalk.red(`未知命令 ${chalk.yellow(cmd)}`))
  console.log()
  suggestCommands(cmd, program.commands, THRESHOLD)
})

// 增加说明
program.on('--help', () => {
  // 使用 figlet 绘制 Logo
  console.log(
    '\r\n' +
      figlet.textSync(pk.name, {
        font: 'Ghost',
        horizontalLayout: 'default',
        verticalLayout: 'default',
        width: 80,
        whitespaceBreak: true
      })
  )
  console.log(
    `\r\nRun ${chalk.cyan(
      `chcli <command> --help`
    )} for detailed usage of given command\r\n`
  )
})

// 重写参数缺失错误信息
enhanceErrorMessage('missingArgument', (argsName) => {
  return `缺少参数 ${chalk.yellow(`<${argsName}>`)}`
})

program.parse(process.argv)
