const { createPerformanceWt } = require('./wt')

exports.initErrorHandler = function() {
  window.addEventListener('error', function(err) {
    const { colno, lineno, filename, message, error: { stack } } = err
    createPerformanceWt().track('scriptError', {
      $type: 'error',
      colno, lineno, filename, message, stack
    })
    console.error(err)
  })

  window.addEventListener('unhandledrejection', function(event) {
    const err = event.reason
    createPerformanceWt().track('promiseError', {
      $type: 'error',
      message: JSON.stringify(err.message ?? err),
      stack: err.stack || ''
    })
  })
}