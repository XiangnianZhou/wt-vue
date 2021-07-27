const { createWt, cacheFirstDay } = require('./wt')
const equal = require('fast-deep-equal')


let intoRouterTime = ''
let currentRouter = ''

function createHandler(eventName, data = {}, modifiers = {}) {
  const fn = (event) => {
    // 修饰符
    const { stop, self, prevent } = modifiers
    if (stop) event.stopPropagation()
    if (prevent) event.preventDefault()
    if (self && event.target !== event.currentTarget) return

    const el = event.currentTarget
    const tag = el.tagName.toLowerCase()
    const wtData = {
      ...data,
      $tag: tag,
      $type: event.type || ''
    }
    if (tag === 'input' || tag === 'textarea') {
      wtData.$value = el.value
      wtData.$type = 'input' // 'input' 和 'textarea' 的事件都置为 input 类型
    } else {
      const { innerText = '' } = el
      wtData.$value = innerText.replace(/\r?\n/g, ' ')
    }
    const { name } = this.$route ?? {}
    wtData.$pageId = name || ''
    const wt = createWt()
    wt.track(eventName, {
      ...wtData,
    })
  }
  return fn
}

function createVueHandler(event, data = {}) {
  return () => {
    const wt = createWt()
    wt.track(event, data)
  }
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

function getWtEvent(wtEvent, directModifiers = {}) {
  let eventType
  let wtEventName = wtEvent
  let data = {}

  let modifiers = {}

  if (typeof wtEvent === 'string') {
    const eventMatch = wtEvent.match(/[^_]+_([^_]+)/)
    if (!eventMatch) {
      throw new ReferenceError('v-wt 的指令值格式非法，请使用 gift_click_okButton 形式')
    }
    eventType = eventMatch[1]
    data.$type = eventType
    modifiers = directModifiers
  } else if (wtEvent.$event) {
    if (!wtEvent.$type) {
      throw new ReferenceError('v-wt 的指令值格式非法，必须指定$type属性')
    }
    wtEventName = wtEvent.$event
    eventType = wtEvent.$type;
    ['$$native', '$$stop', '$$self', '$$prevent'].forEach(key => {
      const newKey = key.slice(2)
      modifiers[newKey] = !!(wtEvent[key] || directModifiers[newKey])
      delete wtEvent[key]
    })

    data = {
      ...wtEvent
    }
  }
  return {
    eventType, wtEventName, data, modifiers
  }
}

const wtEventMap = new Map()
function updateEvent(el, binding, vnode) {
  const directiveValue = binding.value
  if (!directiveValue) {
    throw new ReferenceError('无法找到 v-wt 的指令值')
  }
  const { elm, context, componentInstance } = vnode

  if (Array.isArray(directiveValue)) {
    directiveValue.forEach(bindEvent)
  } else {
    bindEvent(directiveValue)
  }

  function bindEvent(directiveEvent) {
    const { eventType, wtEventName, data, modifiers } = getWtEvent(directiveEvent, binding.modifiers)
    const isVueComponent = componentInstance && !modifiers.native
    const callHandler =  (isVueComponent ? createVueHandler : createHandler)
      .call(context, wtEventName, data, modifiers)
    
    const mapItem = wtEventMap.get(el)
    const handlerList = mapItem || []
    if (!mapItem) wtEventMap.set(el, handlerList)
    handlerList.push({
      handler: callHandler,
      type: eventType
    })

    if (isVueComponent) {
      componentInstance.$on(eventType, callHandler)
    } else if (elm instanceof Element) {
      el.addEventListener(eventType, callHandler, false)
    }
  }
}

function removeEvent(el, binding, vnode) {
  const handlerList = wtEventMap.get(el) || []
  const { elm, componentInstance } = vnode
  if (handlerList && handlerList.length) {
    handlerList.forEach(item => {
      const { handler, type } = item
      if (componentInstance) {
        componentInstance.$off(handler)
      }
      elm.removeEventListener(type, handler)
    })
    wtEventMap.set(el, null)
  }
}

exports.wtMixin = {
  directives: {
    wt: {
      inserted (el, binding, vnode) {
        updateEvent(el, binding, vnode)
      },
      componentUpdated (el, binding, vnode, oldVnode) {
        if (!equal(binding.value, binding.oldValue)) {
          removeEvent(el, binding, vnode)
          updateEvent(el, binding, vnode)
        }
      },
    }
  },
  mounted() {
    // 兼容以前的代码
    window.addEventListener('beforeunload', beforeunloadHandler)
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
