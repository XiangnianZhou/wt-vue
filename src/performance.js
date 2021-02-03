const { getFCP, getFID, getLCP, getTTFB } = require('web-vitals')
const { Tracking } = require('./wt')

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
        domComplete: domComplete - responseEnd, // DOM完成时间
        tls: secureConnectionStart ? connectEnd - secureConnectionStart : 0, // TLS 耗时
      })
      wt.logger.logSending()
    }
  }
  getFCP(joinEntries)
  getFID(joinEntries)
  getLCP(joinEntries)
  getTTFB(joinEntries)
}

function resourceMeasure(wt) {
  performance.getEntriesByType('resource').forEach(item => {
    const reg = new RegExp(`^${wt.logger.url}`)
    if (!reg.test(item.name)) {
      const {
        name,
        connectEnd,
        connectStart,
        duration
      } = item
      wt.track('resourcePerformance', {
        name, // 资源
        duration,
        tcp: connectEnd - connectStart, // TCP 链接耗时
      })
    }
  })
  wt.logger.logSending()
  performance.clearResourceTimings()
}

function startResourceMeasure(wt) {
  setTimeout(() => {
    resourceMeasure(wt)
    startResourceMeasure(wt)
  }, 1000)
}

exports.initPerformace = function initPerformace(host, project, logstore) {
  const wt = new Tracking(host, project, logstore, true)
  keyMeasure(wt)
  startResourceMeasure(wt)
}
