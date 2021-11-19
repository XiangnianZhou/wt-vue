/**
 * 根据阿里的 js-sls-logger 改编
 * https://www.npmjs.com/package/js-sls-logger
 */
class SlsWebLogger {
  constructor(host, project, logstore) {
    this.contents_ = new Array()
    this.host = host //所在区域的host
    this.project = project //project名称
    this.logstore = logstore //logstore名称
    this.urlHost = 'https://' + project + '.' + host
    this.url = this.urlHost + '/logstores/' + logstore + '/track'
    this.arr = []
  }
  createHttpRequest() {
    if (window.ActiveXObject) {
      return new ActiveXObject("Microsoft.XMLHTTP")
    } else if (window.XMLHttpRequest) {
      return new XMLHttpRequest()
    }
  }
  logger(arr = this.arr) {
    let url = this.url
    try {
      const httpRequest_ = this.createHttpRequest()
      httpRequest_.open("POST", url, true)
      httpRequest_.setRequestHeader("x-log-apiversion", "0.6.0")
      const reqPayload = JSON.stringify({
        __logs__: arr,
      })
      httpRequest_.setRequestHeader("x-log-bodyrawsize", reqPayload.length)
      const blob = new Blob(
        [reqPayload], {
          type: 'application/x-protobuf'
        }
      )
      httpRequest_.send(blob)
    } catch (ex) {
      if (window && window.console && typeof window.console.log === 'function') {
        console.log("Failed to log to ali log service because of this exception:\n" + ex)
        console.log("Failed log data:", url)
      }
    }
  }

  transString(obj) {
    let newObj = {}
    for (let i in obj) {
      if (typeof(obj[i]) == 'object') {
        newObj[i] = JSON.stringify(obj[i])
      } else {
        newObj[i] = String(obj[i])
      }
    }
    return newObj
  }

  send(originObj) {
    const obj = this.transString(originObj)
    this.arr.push(obj)
  }
  logSending(throttle) {
    let { arr } = this
    // 节流
    this.arr = arr.filter((_, index) => !(index % 5))
    if (arr && arr.length > 0) {
      this.logger()
      this.arr = []
    }
  }
}

exports.SlsWebLogger = SlsWebLogger
