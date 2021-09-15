// 滚动监听
const { createWt } = require('./wt.js')

const ATTRIBUTE_KEY = 'wt-scroll-anchor'
const ATTRIBUTE_INDEX_KEY = 'wt-scroll-anchor-index'

const io = new IntersectionObserver(entries => {
  entries.forEach(item => {
    const anchorValue = item.target.getAttribute(ATTRIBUTE_KEY)
    const anchorIndex = item.target.getAttribute(ATTRIBUTE_INDEX_KEY)
    createWt().track(`scrollAnchor`, {
      index: anchorIndex,
      $type: 'scrollAnchor',
      show: +item.isIntersecting,
      name: anchorValue
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
