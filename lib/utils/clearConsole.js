const readline = require('readline');

module.exports = async (title) => {
  if (process.stdout.isTTY) {
    // 是否在终端环境
    readline.cursorTo(process.stdout, 0, 0);
    readline.clearScreenDown(process.stdout);

    if (title) console.log(title);
  }
};
