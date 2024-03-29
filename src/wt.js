const { AliLogTracker } = require('./ali-tracker')
const { SlsWebLogger } = require('./sls-log')
const { getRouterMetaData } = require('./util')

const CACHE_DEVICE_ID = '__wt_device_id'
const CACHE_USER_ID = '__wt_user_id'
const CACHE_FIRST_DAY = '__wt_first_day'
const CACHE_SESSION_ID = '__wt_session_id'

exports.cacheFirstDay = CACHE_FIRST_DAY

// 全局变量，多Tracking实例共享
let deviceId = localStorage.getItem(CACHE_DEVICE_ID)
let userId = ''
let sessionId = sessionStorage.getItem(CACHE_SESSION_ID)

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

function createSessionId() {
  const arr = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q',
  'R','S','T','U','V','W','X','Y','Z','a','b','c','d','e','f','g','h','i',
  'j','k','l','m','n','o','p','q','r','s','t','u','v','w','x','y','z','r',
  '0','1','2','3','4','5','6','7','8','9']
  let str = ''
  for (let i = 0; i < 12; i++) {
    str += arr[Math.floor(Math.random() * arr.length)]
  }
  return `${Date.now()}-${str}`
}

function getDeviceInfo() {
  return {
    $screenHeight: window.screen.height || '',
    $screenWidth: window.screen.width || '',
  }
}

function getWtCache() {
  return {
    userId: localStorage.getItem(CACHE_USER_ID),
    deviceId: localStorage.getItem(CACHE_DEVICE_ID),
    fistDay: localStorage.getItem(CACHE_FIRST_DAY)
  }
}

function initSessionId() {
  const isMini = /miniProgram/i.test(navigator.userAgent)
  const urlMatch = /wt_session_id=([\w\-]+)/.exec(location.search)
  if (isMini && urlMatch) {
    sessionId = urlMatch[1]
  } else {
    sessionId = sessionStorage.getItem(CACHE_SESSION_ID) || createSessionId()
  }
  sessionStorage.setItem(CACHE_SESSION_ID, sessionId)
}

class Tracking {
  constructor(host, project, logstore, isComplex = false, router) {
    if (isComplex) {
      this.logger = new SlsWebLogger(host, project, logstore)
    } else {
      this.logger = new AliLogTracker(host, project, logstore)
    }
    if (router && router.app) {
      Object.getPrototypeOf(router.app).$track = this.track.bind(this)
    } else if (router) {
      console.error('建议在根Vue实例化之后调用initWt()，否在无法使用Vue.prototype.$track()')
    }
    
    this.host = host
    this.project = project
    this.logstore = logstore
    this.meta = {}
    this.isComplex = isComplex
    this.vueRouter = router
    this._ignoreOrigin = Object.create(null)
    this.pubConfig = Object.create(null)
  }

  // 同步
  set sessionId(value) {
    sessionId = value
  }
  get sessionId() {
    return sessionId
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
      $latestReferrer: '',
      $latestReferrerHost: '',
    }

    const formateData = {
      ...this.pubConfig,
      $event: event,
      $deviceId: deviceId,
      $sessionId: sessionId,
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
      return this.logger.logger(isKeepalive)
    }
  }

  login(loginId) {
    if (loginId) {
      userId = loginId
      localStorage.setItem(CACHE_USER_ID, loginId)
    }
  }

  addIgnoreOrigin(origin) {
    if (!origin) return
    const errlog = () => console.error('wt.addIgnoreOrigin() 参数必须为字符串或字符串数组')
    const add = key => {
      if (/^http/.test(key)) {
        this._ignoreOrigin[key] = true
      } else {
        console.error('wt.addIgnoreOrigin() 参数必须以http开头')
      }
    }

    if (typeof origin === 'string') {
      add(origin)
    } else if (Array.isArray(origin)) {
      origin.forEach(key => {
        if (typeof key !== 'string') {
          errlog()
          return
        }
        add(key)
      })
    } else {
      errlog()
    }
  }

  addPubConfig(pubConfig) {
    if (pubConfig && typeof pubConfig === 'object') {
      Object.keys(pubConfig).forEach(key => {
        if (typeof pubConfig[key] === 'string') {
          this.pubConfig[key] = pubConfig[key]
        }
      })
    }
  }

  removePubConfig(key) {
    if (typeof key !== 'string' || !key) return
    delete this.pubConfig[key]
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

  initSessionId()

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
exports.createPerformanceWt = createPerformanceWt
