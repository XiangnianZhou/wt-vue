const { creatVueWt } = require('./wt')

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
    } else {
      data.$value = el.innerText.replace(/\r?\n/g, ' ')
    }
    const { dataset } = el
    const { name } = this.$route ?? {}
    const datasets = getDataset(dataset)
    data.$pageId = name || ''
    const wt = creatVueWt(this)
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
    data.$pageId = name || ''
    const wt = creatVueWt(this)
    wt.track(event, data)
  }
}

function addEventListener(isUpdate) {
  const refs = this.$refs
  const refsKeys = Object.keys(refs).filter(i => /^wt_/.test(i))

  refsKeys.forEach(ref => {
    const eventName = ref.substr(3)
    let els = refs[ref] // ref + v-for, els 是一个数组
    if (!Array.isArray(els)) {
      els = [els]
    }

    els.forEach(element => {
      if (!element) return
      let el = element
      const eventMatch = eventName.match(/[^_]+_([^_]+)/)
      if (eventMatch) {
        const eventType = eventMatch[1]
        // if (isUpdate && !el._isVue) {
        //   el.removeEventListener(eventType, createHandler.call(this, eventName))
        // }
        if (el._isVue && !el.__wt_flag) {
          el.$on(eventType, createVueHandler.call(this, eventName, el, eventType))
        } else if (!el._isVue) {
          el.addEventListener(eventType, createHandler.call(this, eventName), false)
        }
      }
    })
  })
}

exports.wtMixin = {
  mounted() {
    addEventListener.call(this)
  },
  updated() {
    addEventListener.call(this, true)
  }
}
