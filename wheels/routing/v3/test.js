const Route = require('./route')

const r = new Route();

r.addRule('/user/{toInt:id}', ['GET', 'POST'], (args)=>{ console.log("call handler args: ", args) })
r.dispatch('/user/123')
