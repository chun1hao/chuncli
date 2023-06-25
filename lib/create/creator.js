const fs = require('fs-extra');
const EventEmitter = require('events');
const chalk = require('chalk');

const getCliVersion = require('../utils/getCliVersion');
const templateGitRepo = require('../config/templateGitRepo.json');
const log = require('../utils/log');
const { logWithSpinner, stopSpinner } = require('../utils/spinner');
const loadRemote = require('../utils/loadRemote');
const clearConsole = require('../utils/clearConsole');

module.exports = class Creator extends EventEmitter {
  constructor(templateName, projectName, context) {
    super();
    this.templateName = templateName;
    this.projectName = projectName;
    this.context = context;
  }

  create = async (cliOptions = {}) => {
    const { templateName, projectName, context } = this;
    const gitRepoUrl = templateGitRepo[templateName];
    let tmpdir;
    await getCliVersion();
    log.info(`✨ 创建项目到： ${chalk.yellow(context)}.`);
    try {
      stopSpinner();
      logWithSpinner(`⠋`, `正在下载，可能需要一些时间。。。`);
      tmpdir = await loadRemote(gitRepoUrl['download'], true);
    } catch (e) {
      stopSpinner();
      log.error(`操作失败 ${chalk.cyan(gitRepoUrl['download'])}: ${e}`);
      process.exit(1);
    }

    try {
      fs.copySync(tmpdir, context);
    } catch (error) {
      return log.error(chalk.red.dim(`Error: ${error}`));
    }

    stopSpinner();
    clearConsole();
    console.log(`🎉  创建项目成功 ${chalk.yellow(projectName)}.`);
    console.log(`\r\n  cd ${chalk.green(projectName)}`);
    console.log(`\r\n  ${chalk.green('npm i')}`);
  };
};
