// 重写Command上的一些报错信息
const { Command } = require('commander');
const chalk = require('chalk');

const npmlog = require('./log');

module.exports = (methodName, log) => {
  Command.prototype[methodName] = function (...args) {
    if (methodName === 'unknownOption' && this._allowUnknowOption) return false;
    this.outputHelp();
    console.log('');
    npmlog.error(chalk.red(log(...args)));
    process.exit(1);
  };
};
