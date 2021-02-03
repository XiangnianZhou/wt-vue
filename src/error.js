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
    createPerformanceWt().track('promiseError', {
      $type: 'error',
      message: event.reason.toString(),
      stack: event.reason.stack || ''
    })
  })
}