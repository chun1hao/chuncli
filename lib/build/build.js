const Service = require('../service/service')
module.exports = async function (opts) {
  const args = {
    config: opts.config,
    startType: opts.type || 'vue'
  }

  process.env.NODE_ENV = 'production'
  const service = new Service('build', args)
  await service.build()
}
