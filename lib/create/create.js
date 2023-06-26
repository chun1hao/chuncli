const path = require('path')
const fs = require('fs-extra')
const chalk = require('chalk')
const validateProjectName = require('validate-npm-package-name')
const inquirer = require('inquirer')

const Creator = require('./creator')
const log = require('../utils/log')
const { pauseSpinner } = require('../utils/spinner')
const checkNodeVersion = require('../utils/checkNodeVesion')
const getCliVersion = require('../utils/getCliVersion')
const tempalteGit = require('../config/templateGitRepo.json')
const { MIN_NODE_VERSION } = require('../constant')

async function create(templateName, projectName, options) {
  if (!checkNodeVersion(MIN_NODE_VERSION)) {
    log.error(
      `node版本过低，更新版本 ${chalk.yellow('>=' + MIN_NODE_VERSION)} `
    )
    return
  }

  if (!tempalteGit[templateName]) {
    log.error(`输入的模板名 ${chalk.yellow(templateName)} 不存在`)
    return
  }
  // 校验项目名(包名)是否合法
  const validateResult = validateProjectName(projectName)
  if (!validateResult.validForOldPackages) {
    log.error(`无效的项目名称：${chalk.red(projectName)}`)
    validateResult.errors &&
      validateResult.errors.forEach((err) => {
        log.error(err)
      })
    process.exit(1)
  }
  if (!validateResult.validForNewPackages) {
    validateResult.warnings &&
      validateResult.warnings.forEach((warn) => {
        log.warn(warn)
      })
  }

  await getCliVersion(true)
  const targetDir = path.resolve(process.cwd(), projectName)
  if (fs.existsSync(targetDir)) {
    if (options.force) {
      fs.removeSync(targetDir)
    } else {
      const { overwrite } = await inquirer.prompt([
        {
          name: 'overwrite',
          type: 'list',
          message: `目录 ${chalk.red(targetDir)} 已经存在，是否覆盖?`,
          choices: [
            { name: '覆盖', value: true },
            { name: '取消创建', value: false }
          ]
        }
      ])
      if (!overwrite) return
      fs.removeSync(targetDir)
    }
  }

  const creator = new Creator(templateName, projectName, targetDir)
  await creator.create(options)
}

module.exports = (templateName, projectName, ...args) => {
  return create(templateName, projectName, args).catch((err) => {
    pauseSpinner()
    log.error(err)
    process.exit(1)
  })
}
