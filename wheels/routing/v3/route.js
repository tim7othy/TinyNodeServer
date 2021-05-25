const Layer = require('./layer');
const { IntConverter, FloatConverter } = require('./converter');
const noop = () => {}

module.exports = class Route {
    constructor() {
        this.layers = []
    }

    addRule(pathRule, methods=['GET'], handler=noop) {
        const layer = new Layer(pathRule, methods, handler, {
            toInt: new IntConverter(),
            toFloat: new FloatConverter(),
        })
        this.layers.push(layer)
    }

    dispatch(path, method, ...args) {
        for (let i = 0; i < this.layers.length; i++) {
            const l = this.layers[i];
            const o = l.match(path, method)
            if (o) {
                o.handler({
                    ...args,
                    ...(o.vars || {}),
                })
            }
        }
    }

};
