const UAParser = require('ua-parser-js')
const { AliLogTracker } = require('./ali-tracker')
const { SlsWebLogger } = require('./sls-log')
const { getRouterMetaData } = require('./util')

const CACHE_DEVICE_ID = '__wt_device_id'
const CACHE_USER_ID = '__wt_user_id'
const CACHE_FIRST_DAY = '__wt_first_day'

exports.cacheFirstDay = CACHE_FIRST_DAY

let deviceId = localStorage.getItem(CACHE_DEVICE_ID)
let userId = ''

/**
 * 生成UUid
 * https://github.com/sensorsdata/sa-sdk-javascript
 */
function UUid() {
  const T = function T() {
    const d = 1 * new Date()
    let i = 0
    while (d == 1 * new Date()) {
      i++
    }
    return d.toString(16) + i.toString(16)
  }
  const R = function R() {
    return Math.random().toString(16).replace('.', '')
  }
  const UA = function (n) {
    const ua = navigator.userAgent
    let i, ch, buffer = []
    let ret = 0

    function xor(result, byte_array) {
      let j, tmp = 0
      for (j = 0; j < byte_array.length; j++) {
        tmp |= (buffer[j] << j * 8)
      }
      return result ^ tmp
    }

    for (i = 0; i < ua.length; i++) {
      ch = ua.charCodeAt(i)
      buffer.unshift(ch & 0xFF)
      if (buffer.length >= 4) {
        ret = xor(ret, buffer)
        buffer = []
      }
    }

    if (buffer.length > 0) {
      ret = xor(ret, buffer)
    }

    return ret.toString(16)
  }

  return function createUUId() {
    let se = String(window.screen.height * window.screen.width)
    if (se && /\d{5,}/.test(se)) {
      se = se.toString(16)
    } else {
      se = String(Math.random() * 31242).replace('.', '').slice(0, 8)
    }
    // const val = (T() + '-' + R() + '-' + UA() + '-' + se + '-' + T())
    const val = `${T()}-${R()}-${UA()}-${se}-${T()}`
    if (val) {
      return val
    }
    return (String(Math.random()) + String(Math.random()) + String(Math.random())).slice(2, 15)
  }
}

function createDeviceId() {
  const createUUId = UUid()
  deviceId = createUUId()
  localStorage.setItem(CACHE_DEVICE_ID, deviceId)
  localStorage.setItem(CACHE_FIRST_DAY, Date.now())
  return deviceId
}


function getDeviceInfo() {
  const parser = new UAParser()
  const browserInfo = parser.getResult()

  const { device, browser: rawBrowser, os: rawOS } = browserInfo
  return {
    $model: device.model || '',
    $os: rawOS.name || '',
    $manufacturer: device.vendor || '',
    $osVersion: rawOS.version || '',
    $screenHeight: window.screen.height || '',
    $screenWidth: window.screen.width || '',
    $browser: rawBrowser.name || '',
    $browserVersion: rawBrowser.version || '',
  }
}

function getWtCache() {
  return {
    userId: localStorage.getItem(CACHE_USER_ID),
    deviceId: localStorage.getItem(CACHE_DEVICE_ID),
    fistDay: localStorage.getItem(CACHE_FIRST_DAY)
  }
}

class Tracking {
  constructor(host, project, logstore, isComplex = false, router) {
    if (isComplex) {
      this.logger = new SlsWebLogger(host, project, logstore)
    } else {
      this.logger = new AliLogTracker(host, project, logstore)
    }
    this.host = host
    this.project = project
    this.logstore = logstore
    this.meta = {}
    this.isComplex = isComplex
    this.vueRouter = router
  }

  track(event, data = {}, isKeepalive) {
    // 需先调用 login
    if (!deviceId) {
      this.login()
    }
    const latestReferrer = window.document.referrer || ''
    const matchHost = latestReferrer.match(/https?:\/\/([^/:]+)/)

    if (this.vueRouter && this.vueRouter.currentRoute) {
      this.meta = {
        ...getRouterMetaData(this.vueRouter.currentRoute.meta)
      }
    }

    const edge = {
      $userId: userId || deviceId,
      $ip: window.__$ip || '',
      $cityId: window.__$cid || '',
      $city: window.__$city || '',
      $country: window.__$country || '',
      $latestReferrer: '',
      $latestReferrerHost: '',
    }

    const formateData = {
      $event: event,
      $deviceId: deviceId,
      // wtVersion: '0.1.0',
      $url: window.location.href,
      $timestap: Date.now(),
      $ua: navigator.userAgent || '',
      ...(this.isComplex ? {} : edge),
      ...this.meta,
      ...data,
      json: JSON.stringify(data.json || {})
    }
    if (!formateData.$type) {
      console.error(event, 'wt error：需要指定事件类型')
      formateData.$type = 'unknown'
    }
    if (latestReferrer && matchHost && matchHost[1] !== window.location.hostname) {
      formateData.$latestReferrer = latestReferrer
      formateData.$latestReferrerHost = matchHost ? matchHost[1] : ''
    }
    
    if (this.isComplex) {
      this.logger.send(formateData)
    } else {
      const keys = Object.keys(formateData)
      for (const key of keys) {
        this.logger.push(key, formateData[key])
      }
      this.logger.logger(isKeepalive)
    }
  }

  login(loginId) {
    if (loginId) {
      userId = loginId
      localStorage.setItem(CACHE_USER_ID, loginId)
    }
  }
}

let wtCache = null
function createWt(host, project, logstore, router) {
  if (wtCache) {
    return wtCache
  }
  
  if (!host || !project || !logstore) {
    throw new Error('未初始化 wt, 请先调用 initWt()')
  }

  const wt = new Tracking(host, project, logstore, false, router)
  wtCache = wt
  return wt
}
// 接口兼容
const creatVueWt = createWt

let performanceCache = null
function createPerformanceWt(host, project, logstore) {
  if (performanceCache) {
    return performanceCache
  }
  if (!host || !project || !logstore) {
    throw new Error('不能初始化性能Wt')
  }
  const wt = new Tracking(host, project, logstore, true)
  performanceCache = wt
  return wt
}

function initWt (host, project, logstore, router) {
  const wt = createWt(host, project, logstore, router)
  if (window.returnCitySN) {
    const {
      cip = '',
      cid = '',
      cname = ''
    } = window.returnCitySN
    
    window.__$ip = cip
    if (/^\d+$/.test(cid)) {
      window.__$city = cname
      window.__$cid = cid
    } else {
      window.__$country = cname
    }
  }

  if (!deviceId) {
    createDeviceId()
    const baseInfo = getDeviceInfo()
    wt.track('deviceInfo', {
      $type: 'deviceInfo',
      ...baseInfo
    })
  }
  wtCache = wt
  return wt
}

exports.getWtCache = getWtCache
exports.Tracking = Tracking
exports.initWt = initWt
exports.createWt = createWt
exports.creatVueWt = creatVueWt
exports.createPerformanceWt = createPerformanceWt
