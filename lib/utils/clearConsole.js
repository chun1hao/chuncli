const readline = require('readline')

// module.exports = async (title) => {
//   if (process.stdout.isTTY) {
//     // 是否在终端环境
//     readline.cursorTo(process.stdout, 0, 0)
//     readline.clearScreenDown(process.stdout)

//     if (title) console.log(title)
//   }
// }

module.exports = function clearConsole() {
  if (process.stdout.isTTY) {
    process.stdout.write(
      process.platform === 'win32' ? '\x1B[2J\x1B[0f' : '\x1B[2J\x1B[3J\x1B[H'
    )
  }
}
