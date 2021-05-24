const Router = require('./routing')

const r = new Router();

r.addRoute('/user/{toInt:id}', ()=>{})
const m = r.match('/user/123')
console.log(m)