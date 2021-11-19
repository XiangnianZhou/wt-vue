// 滚动监听
const { createWt } = require('./wt.js')

const ATTRIBUTE_KEY = 'wt-scroll-anchor'
const ATTRIBUTE_INDEX_KEY = 'wt-scroll-anchor-index'
const ATTRIBUTE_TIME_KEY = 'wt-scroll-anchor-time'

const io = new IntersectionObserver(entries => {
  entries.forEach(item => {
    const { target } = item
    const anchorValue = target.getAttribute(ATTRIBUTE_KEY)
    const anchorIndex = target.getAttribute(ATTRIBUTE_INDEX_KEY)
    const isShow = item.isIntersecting
    const ex = {}
    if (isShow) {
      target.setAttribute(ATTRIBUTE_TIME_KEY, `${Date.now()}`)
    }
    const time = +target.getAttribute(ATTRIBUTE_TIME_KEY)
    if (!isShow) {
      if (!time) return
      ex.duration = Date.now() - time
      target.removeAttribute(ATTRIBUTE_TIME_KEY)
    }
    createWt().track(`scrollAnchor`, {
      index: anchorIndex,
      $type: 'scrollAnchor',
      show: +item.isIntersecting,
      anchorName: anchorValue,
      ...ex,
    })
  })
})

exports.scrollAnchorHandler = function scrollAnchorHandler() {
  const anchors = document.querySelectorAll(`[${ATTRIBUTE_KEY}]`)
  anchors.forEach((item, index) => {
    item.setAttribute(ATTRIBUTE_INDEX_KEY, index + 1)
    io.observe(item)
  })
}
