require('whatwg-fetch');
const { initErrorHandler } = require('./error');
const { initPerformance } = require('./performance');

const { createWt, initWt, createPerformanceWt } = require('./wt.js')
const { wtMixin, wtRouterAfterHook } = require('./mixin.js')

initErrorHandler()

function initVueWt(host, project, logstore, Vue, router) {
  const wt = initWt(host, project, logstore, router)
  if (Vue && Vue.config) {
    Vue.config.errorHandler = function (err, vm, info) {
      const { message, name, stack } = err
      createPerformanceWt().track('vueError', {
        $type: 'error',
        message: `${name}: ${message}`,
        info,
        stack
      })
      console.error(err)
    }
  }
  
  if (Vue && typeof Vue.mixin === 'function') {
    Vue.mixin(wtMixin)
  }

  if (router) {
    router.afterEach(wtRouterAfterHook)
  }
  return wt
}

exports.initWt = initVueWt
exports.initPerformance = initPerformance
exports.createWt = createWt
