const detetcPort = require('detect-port')
const inquirer = require('inquirer')

const { DEFAULT_PORT } = require('../constant/index')
const Service = require('../service/service')

;(async () => {
  const params = process.argv.slice(2)
  const paramsObj = {}

  params.forEach((param) => {
    let [key, val] = param.split(' ')
    paramsObj[key.replace('--', '')] = val
  })

  const defaultPort = paramsObj['port'] || DEFAULT_PORT

  try {
    const newPort = await detetcPort(defaultPort)
    if (newPort != defaultPort && paramsObj.childPortChoice === '0') {
      const { choicePort } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'choicePort',
          message: `当前端口 ${defaultPort} 已经被占用，是否启用新的端口号 ${newPort}`
        }
      ])
      if (!choicePort) {
        process.exit(1)
      }
      process.send({ choicePort: '1' })
    }

    const args = {
      port: newPort,
      config: paramsObj.config,
      startType: paramsObj.startType
    }

    const service = new Service(args)
    service.start()
  } catch (e) {
    console.log(e)
  }
})()
