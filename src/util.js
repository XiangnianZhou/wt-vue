exports.getRouterMetaData = function(meta = {}) {
  const m = {}
  const {
    wtIsLandingPage,
    productNo,
    productVersion,
    title = '',
    wtPublic = {}
  } = meta
  if (wtIsLandingPage && productNo && productVersion) {
    m.productNo = productNo
    m.productVersion = productVersion
  }
  if (title) {
    m.pageTitle = title
  }
  Object.keys(wtPublic).forEach(key => {
    m[key] = wtPublic[key]
  })
  return m
}
