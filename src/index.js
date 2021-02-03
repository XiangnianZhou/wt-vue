require('whatwg-fetch');
const { initErrorHandler } = require('./error');
const { initPerformace } = require('./performance');

const { createWt, initWt, creatVueWt } = require('./wt')
const { wtMixin, wtRouterAffterHook } = require('./mixin')

initErrorHandler()
// initPerformace()

function initVueWt(host, project, logstore, Vue, router) {
  initWt(host, project, logstore, router)
  Vue.config.errorHandler = function (err, vm, info) {
    const { message, name, lineNumber, columnNumber, stack, filename } = err
    createWt().track('vueError', {
      $type: 'error',
      json: {
        colno: columnNumber,
        lineno: lineNumber,
        filename,
        message: `${name}: ${message}`,
        info,
        stack
      }
    })
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
