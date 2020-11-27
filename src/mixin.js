const { createWt } = require('./wt')

function addEventListener(isUpdate) {
  const refs = this.$refs
  const refsKeys = Object.keys(refs).filter(i => /^wt_/.test(i))
  function createHandler(eventName, type) {
    return (event) => {
      event.stopImmediatePropagation()
      const el = event.currentTarget;
      const data = {
        $tag: el.tagName.toLowerCase()
      }
      if (type === 'click') {
        // 拿到点击元素的内容
        // event.target.tagName.toLowerCase()
        data.$value = el.innerText.replace(/\r?\n/g, ' ')
      } else if (type === 'input') {
        data.$value = el.value
      }
      const { wtLib, wtPage } = el.dataset
      const { name } = this.$route ?? {}
      // 同时上报 页面参数
      // if (params) {
      //   Object.keys(params).map(key => {
      //     const value = params[key]
      //     return {
      //       value,
      //       index: window.location.href.indexOf(value)
      //     }
      //   }).sort(i => i.index).forEach((param, index) => {
      //     data[`urlParam${index + 1}`] = param.value
      //   })
      // }
      data.$pageId = wtPage || name || ''
      const wt = createWt(wtLib)
      wt.track(eventName, data)
    }
  }
  refsKeys.forEach(ref => {
    const eventName = ref.substr(3)
    let els = refs[ref] // ref + v-for, els 是一个数组
    if (!Array.isArray(els)) {
      els = [els]
    }

    els.forEach(element => {
      if (!element) return
      let el = element
      if (el.$el) {
        // ref 可能指向一个组件
        el = el.$el
      }
      const eventMatch = eventName.match(/[^_]+_([^_]+)/)
      if (eventMatch) {
        const eventType = eventMatch[1]
        if (isUpdate) {
          el.removeEventListener(eventType, createHandler.call(this, eventName, eventType))
        }
        el.addEventListener(eventType, createHandler.call(this, eventName, eventType), false)
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
