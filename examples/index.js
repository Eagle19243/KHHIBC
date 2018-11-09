var khhibc = require('../src/index')
var obj = khhibc.decode("+M4400700080/$$3200430PRLU18C51")
console.log(obj)
console.log(obj.deviceID())