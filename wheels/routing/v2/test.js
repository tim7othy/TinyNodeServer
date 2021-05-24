const Router = require('./routing')

const r = new Router();

r.addRoute('/user/{toInt(radix=10):id}/{toFloat:num}', ()=>{})
// const m = r.match('/user/123')
// console.log()
