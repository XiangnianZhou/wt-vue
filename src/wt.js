const UAParser = require('ua-parser-js')
const Tracker = require('./ali-tracker')

const CACHE_DEVICE_ID = '__wt_device_id'
const CACHE_USER_ID = '__wt_user_id'
const CACHE_FIRST_DAY = '__wt_first_day'

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

exports.getWtCache = function getWtCache() {
  return {
    userId: localStorage.getItem(CACHE_USER_ID),
    deviceId: localStorage.getItem(CACHE_DEVICE_ID),
    fistDay: localStorage.getItem(CACHE_FIRST_DAY)
  }
}

exports.Tracking = class Tracking {
  constructor(host, project, logstore) {
    this.logger = new Tracker(host, project, logstore)
  }

  track(event, data) {
    // 需先调用 login
    if (!deviceId) {
      this.login()
    }

    const latestReferrer = window.document.referrer || ''
    const matchHost = latestReferrer.match(/https?:\/\/([^/:]+)/)

    const formateData = {
      $event: event,
      $userId: userId || deviceId,
      $deviceId: deviceId,
      // wtVersion: '0.1.0',
      $url: window.location.href,
      $ip: window.__$ip || '',
      $city: window.__$city || '',
      $country: window.__$country || '',
      $latestReferrer: '',
      $latestReferrerHost: '',
      $timestap: Date.now(),
      ...data,
      json: JSON.stringify(data.json || {})
    }
    if (latestReferrer && matchHost && matchHost[1] !== window.location.hostname) {
      formateData.$latestReferrer = latestReferrer
      formateData.$latestReferrerHost = matchHost ? matchHost[1] : ''
    }
    const keys = Object.keys(formateData)
    for (const key of keys) {
      this.logger.push(key, formateData[key])
    }
    this.logger.logger()
  }

  login(loginId) {
    if (loginId) {
      userId = loginId
      localStorage.setItem(CACHE_USER_ID, loginId)
    }
  }
}

let wtCache = null
exports.createWt = function createWt(host, project, logstore) {
  if (wtCache) {
    return wtCache
  }
  const wt = new Wt(host, project, logstore)
  wtCache = wt
  return wt
}

exports.initWt = function initWt (host, project, logstore) {
  wt = createWt(host, project, logstore)
  if (!deviceId) {
    createDeviceId()
    const baseInfo = getDeviceInfo()
    wt.track('deviceInfo', {
      ...baseInfo
    })
  }
  return wt
}