require('whatwg-fetch');

const { createWt, initWt, creatVueWt } = require('./wt')
const { wtMixin } = require('./mixin')

exports.initWt = initWt
exports.createWt = createWt
exports.creatVueWt = creatVueWt
exports.wtMixin = wtMixin
