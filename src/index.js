require('whatwg-fetch');
const { initErrorHandler } = require('./error');
const { initPerformace } = require('./performance');

const { createWt, initWt, creatVueWt, createPerformanceWt } = require('./wt')
const { wtMixin, wtRouterAffterHook } = require('./mixin')

initErrorHandler()

function initVueWt(host, project, logstore, Vue, router) {
  initWt(host, project, logstore, router)
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
  if (typeof Vue.mixin === 'function') {
    Vue.mixin(wtMixin)
  }

  router.afterEach(wtRouterAffterHook)
}

exports.initWt = initVueWt
exports.initPerformace = initPerformace
exports.createWt = createWt
exports.creatVueWt = creatVueWt
