const { exec } = require('child_process');
const semver = require('semver');
const chalk = require('chalk');

const pk = require('../../package.json');
const clearConsole = require('./clearConsole');
const log = require('../utils/log');

module.exports = async (checkUpdate) => {
  let local = pk.version;
  let name = pk.name;

  return new Promise((resolve) => {
    exec(`npm view ${name} version`, (error, stdout, stderr) => {
      if (error) {
        log.error(error.stack);
        log.error('Error code: ' + error.code);
        log.error('Signal received: ' + error.signal);
        process.exit(1);
      } else {
        let title = chalk.bold.blue(`CHCLI v${local}`);
        let latestVersion = semver.valid(semver.coerce(stdout));
        if (checkUpdate && semver.satisfies(latestVersion, '>' + local)) {
          // 提示升级
          title += chalk.green(`
  ┌────────────────────${`─`.repeat(latestVersion.length)}──┐
  │  Update available: ${latestVersion}  │
  └────────────────────${`─`.repeat(latestVersion.length)}──┘`);
        }
        clearConsole(title);
        resolve(true);
      }
    });
  });
};
