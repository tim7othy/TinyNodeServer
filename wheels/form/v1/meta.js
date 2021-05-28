const proto = require('./form')
const mixin = require('./mixin')
module.exports = class FormMeta {
    static SchemaForm(cls) {
        const schemaOptions = {}
        const fieldKeys = Reflect.ownKeys(cls).filter(k => k.endsWith('Field'))
        fieldKeys.forEach(k => {
            const attr = k.replace(/([a-zA-Z_][a-zA-Z0-9_]+)Field/g, '$1')
            schemaOptions[attr] = Reflect.get(cls, k)
        })
        // Object.assign(cls.prototype, proto)
        cls.prototype._schema = schemaOptions
        mixin(cls.prototype, proto, false)
        return cls
    }
}