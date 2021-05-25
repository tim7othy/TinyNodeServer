const Router = require('./routing')

const r = new Router();

r.addRoute('/user/{toInt:id}', ()=>{ console.log("call handler") })
const m = r.match('/user/123')
if (m && m.handler) {
    m.handler()
}