const { createWt, cacheFirstDay } = require('./wt')

let intoRouterTime = ''
let currentRouter = ''

function getDataset(dataset) {
  const data = {}
  if (dataset) {
    Object.keys(dataset).forEach(key => {
      if (/^wt/.test(key)) {
        const newKey = key.replace(/wt(.)/, ($1, $2) => $2.toLowerCase())
        data[newKey] = dataset[key]
      }
    })
  }
  return data
}

const eventCallbacks = {}
function createHandler(eventName) {
  if (eventCallbacks[eventName]) return eventCallbacks[eventName]
  const fn = (event) => {
    event.stopImmediatePropagation()
    const el = event.currentTarget
    const tag = el.tagName.toLowerCase()
    const data = {
      $tag: tag,
      $type: event.type || ''
    }
    if (tag === 'input' || tag === 'textarea') {
      data.$value = el.value
      data.$type = 'input' // 'input' 和 'textarea' 的事件都置为 input 类型
    } else {
      data.$value = el.innerText.replace(/\r?\n/g, ' ')
    }
    const { dataset } = el
    const { name } = this.$route ?? {}
    const datasets = getDataset(dataset)
    data.$pageId = name || ''
    const wt = createWt()
    wt.track(eventName, {
      ...data,
      ...datasets
    })
  }
  eventCallbacks[eventName] = fn
  return fn
}

function createVueHandler(event, el, type) {
  el.__wt_flag = true
  return () => {
    const data = {
      $type: type,
      $value: el.value || '' // vue 组件一般比较复杂，不以 innerText 为value
    }
    const attrs = el.$attrs ?? {}
    if (typeof attrs === 'object') {
      Object.keys(attrs).forEach(key => {
          const reg = /^data-wt-/
          if (reg.test(key)) {
              const newKey = key.replace(reg, '')
              data[newKey] = attrs[key]
          }
      })
    }
    // data.$pageId = name || ''
    const wt = createWt()
    wt.track(event, data)
  }
}

/**
 * 兼容以前的代码
 */
function addEventListener() {
  const refs = this.$refs
  const refsKeys = Object.keys(refs).filter(i => /^wt_/.test(i))

  refsKeys.forEach(ref => {
    let els = refs[ref] // ref + v-for, els 是一个数组
    if (!Array.isArray(els)) {
      els = [els]
    }

    els.forEach(element => {
      if (!element) return
      let el = element
      const eventName = ref.substr(3)
      const eventMatch = eventName.match(/[^_]+_([^_]+)/)
      if (eventMatch) {
        const eventType = eventMatch[1]
        if (el._isVue && !el.__wt_flag) {
          el.$on(eventType, createVueHandler.call(this, eventName, el, eventType))
        } else if (!el._isVue) {
          el.addEventListener(eventType, createHandler.call(this, eventName), false)
        }
      }
    })
  })
}

function beforeunloadHandler() {
  createWt().track('pageOut', {
    $type: 'pageOut',
    $pageId: currentRouter,
    duration: Date.now() - intoRouterTime,
  }, true)
}

exports.wtRouterAffterHook = function wtRouterAffterHook(to, from) {
  const wtCacheDay = new Date(+localStorage.getItem(cacheFirstDay))
  const now = new Date()
  const isTody = wtCacheDay.getFullYear() === now.getFullYear()
    && wtCacheDay.getMonth() === now.getMonth()
    && wtCacheDay.getDate() === now.getDate()

  intoRouterTime = Date.now()
  currentRouter = from.name || from.path
  createWt().track('routerChange', {
    $type: 'routerChange',
    $to: to.name || to.path,
    $from: currentRouter,
    $pageId: to.name,
    $firstDay: +isTody
  })
}

exports.wtMixin = {
  directives: {
    wt: {
      inserted (el, binding, vnode) {
        const directiveValue = binding.value
        if (!directiveValue) {
          throw new ReferenceError('无法找到 v-wt 的指令值')
        }

        const eventMatch = directiveValue.match(/[^_]+_([^_]+)/)
        if (!eventMatch) {
          throw new ReferenceError('v-wt 的指令值格式非法，请使用 major_click_okButton 形式')
        }
        const eventType = eventMatch[1]
        const { elm, context, componentInstance } = vnode
        if (componentInstance) {
          componentInstance.$on(eventType, createVueHandler.call(context, directiveValue, el, eventType))
        } else if (elm instanceof HTMLElement) {
          el.addEventListener(eventType, createHandler.call(context, directiveValue), false)
        }
      }
    }
  },
  mounted() {
    // 兼容以前的代码
    addEventListener.call(this)
    window.addEventListener('beforeunload', beforeunloadHandler)
  },
  updated() {
    // 兼容以前的代码
    addEventListener.call(this)
  },
  beforeRouteLeave(to, from, next) {
    createWt().track('pageOut', {
      $type: 'pageOut',
      $pageId: from.name || from.path,
      duration: Date.now() - intoRouterTime,
    })
    next()
  },
}
