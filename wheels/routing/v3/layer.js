const Rule = require('./rule')
const {Converter} = require('./converter')

module.exports = class Layer {
    constructor(pathRule, methods, handler, converters) {
        this.rule = new Rule(pathRule)
        this.methods = methods
        this.handler = handler
        this.converters = {
            default: new Converter(),
            ...(converters || {})
        }
        this.rule.bind(this)
    } 

    match(path, method) {
        const { isMatch, vars } = this.rule.match(path)
        if (!isMatch) return null
        if ((!method) || (this.methods.includes(method))) return {
            handler: this.handler,
            vars,
        }
    }
}
