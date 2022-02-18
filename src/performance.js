const { getFCP, getFID, getLCP, getTTFB } = require('web-vitals')
const { Tracking, createPerformanceWt } = require('./wt.js')

function keyMeasure(wt) {
  let performanceInfo = Object.create(null)
  function joinEntries(entry) {
    if (entry.name && entry.value) {
      performanceInfo[entry.name.toLowerCase()] = entry.value
    }
    const {
      fcp,
      fid,
      lcp,
      ttfb
    } = performanceInfo
    if (fcp && fid && lcp && ttfb) {
      let timing = window.performance && window.performance.getEntriesByType('navigation')
      timing = Array.isArray ? timing[0] : performance.timing
      const {
        fetchStart,
        navigationStart,
        domainLookupStart,
        domainLookupEnd,
        connectStart,
        connectEnd,
        secureConnectionStart,
        requestStart,
        responseStart,
        responseEnd,
        domInteractive,
        domContentLoadedEventStart,
        domContentLoadedEventEnd,
        loadEventStart,
        domComplete,
    } = timing
      wt.track('keyPerformance', {
        $type: 'performance',
        fcp, // first contentful paint 首次内容绘制
        fid, // First Input Delay 首次输入延迟
        lcp, // Largest Contentful Paint 最大可见元素绘制
        ttfb, // Time to First Byte 接收到首字节
        tti: domInteractive - fetchStart,  // Time to Interactive 可交互时间
        ready: domContentLoadedEventStart - fetchStart, // domContentLoaded
        load: loadEventStart - fetchStart,  // on load
        dns: domainLookupEnd - domainLookupStart, // DNS 解析耗时
        tcp: connectEnd - connectStart, // TCP 链接耗时
        network: responseEnd - responseStart, // 网络交互耗时
        dom: domInteractive - responseEnd, // DOM解析时间
        complete: domComplete - responseEnd, // DOM完成时间
        tls: secureConnectionStart ? connectEnd - secureConnectionStart : 0, // TLS 耗时
      })
    }
  }
  getFCP(joinEntries)
  getFID(joinEntries)
  getLCP(joinEntries)
  getTTFB(joinEntries)
}

function resourceMeasure(wt) {
  performance.getEntriesByType('resource').forEach(item => {
    const selftReg = new RegExp(`^${wt.logger.urlHost}`)
    const isSelf = selftReg.test(item.name)
    const isIgnore = Object.keys(wt._ignoreOrigin).some(i => item.name.startsWith(i))
    if (!isSelf && !isIgnore) {
      const {
        name,
        connectEnd,
        connectStart,
        duration
      } = item
      wt.track('resourcePerformance', {
        $type: 'performance',
        name, // 资源
        duration, // 请求耗时
        tcp: connectEnd - connectStart, // TCP 链接耗时
      })
    }
  })
  wt.logger.logSending(true /** throttle */) // 发送
  performance.clearResourceTimings()
}

function startResourceMeasure(wt) {
  setTimeout(() => {
    resourceMeasure(wt)
    startResourceMeasure(wt)
  }, 3000)
}

exports.initPerformance = function initPerformance(host, project, logstore, Vue) {
  const wt = createPerformanceWt(host, project, logstore)
  keyMeasure(wt)
  startResourceMeasure(wt)
  if (Vue) {
    Vue.prototype.$performanceTrack = wt.track.bind(wt)
  }
  return wt
}
