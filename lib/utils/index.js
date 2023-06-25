const chalk = require('chalk');
const didYouMean = require('didyoumean');

// 简易匹配用户命令
function suggestCommands(cmd, commands, threshold) {
  const avaliableCommands = commands.map((cmd) => cmd._name);
  const suggestion = didYouMean(cmd, avaliableCommands);
  if (suggestion) {
    console.log(chalk.green(`你是否想输入 ${chalk.red(suggestion)} ?`));
  }
}

module.exports = {
  suggestCommands
};
