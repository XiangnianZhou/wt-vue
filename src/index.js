require('whatwg-fetch');
const { initErrorHandler } = require('./error');
const { initPerformace } = require('./performance');

const { createWt, initWt, createPerformanceWt } = require('./wt')
const { wtMixin, wtRouterAffterHook } = require('./mixin')

initErrorHandler()

function initVueWt(host, project, logstore, Vue, router) {
  initWt(host, project, logstore, router)
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
    router.afterEach(wtRouterAffterHook)
  }
}

exports.initWt = initVueWt
exports.initPerformace = initPerformace
exports.createWt = createWt
