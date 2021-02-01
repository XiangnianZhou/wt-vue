const { createWt } = require('./wt')

exports.initErrorHandler = function() {
  window.addEventListener('error', function(err) {
    const { colno, lineno, filename, message, error: { stack } } = err
    createWt().track('scriptError', {
      $type: 'error',
      json: {
        colno, lineno, filename, message, stack
      }
    })
  })

  window.addEventListener('unhandledrejection', function(event) {
    createWt().track('promiseError', {
      $type: 'error',
      json: {
        message: event.reason
      }
    })
  })
}