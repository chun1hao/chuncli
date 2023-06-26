const ora = require('ora')
const chalk = require('chalk')

const spinner = ora()

let lastMsg = null

function logWithSpinner(symbol, msg) {
  if (!msg) {
    msg = symbol
    symbol = chalk.green('√')
  }

  if (lastMsg) {
    spinner.stopAndPersist({
      symbol: lastMsg.symbol,
      text: lastMsg.text
    })
  }

  spinner.text = msg
  lastMsg = {
    symbol: symbol,
    text: msg
  }

  spinner.start()
}

function stopSpinner(persist) {
  if (lastMsg && persist !== false) {
    spinner.stopAndPersist({
      symbol: lastMsg.symbol,
      text: lastMsg.text
    })
  } else {
    spinner.stop()
  }
  lastMsg = null
}

function pauseSpinner() {
  spinner.stop()
}

function resumeSpinner() {
  spinner.start()
}

module.exports = {
  logWithSpinner,
  stopSpinner,
  pauseSpinner,
  resumeSpinner
}
