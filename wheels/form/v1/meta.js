const proto = require('./form')
const mixin = require('./mixin')
module.exports = class FormMeta {
    static SchemaForm(cls) {
        const fields = {}
        const fieldKeys = Reflect.ownKeys(cls).filter(k => k.endsWith('Field'))
        fieldKeys.forEach(k => {
            const attr = k.replace(/([a-zA-Z_][a-zA-Z0-9_]+)Field/g, '$1')
            fields[attr] = Reflect.get(cls, k)
        })
        const subCls = class Sub extends cls{
            constructor(...args) {
                super(...args)
                this._fields = fields
            }

            init(formData) {
                // 保存客户端传递的表单数据
                this.formData = formData || {}
                // 从具体的表单类中提取的字段信息
                for (const [key, field] of Object.entries(this._fields)) {
                    // 用户定义的具体表单类中设置的字段名，现在在表单实例上挂载同名的字段的具体值
                    // （目前还没有值，经过处理与验证后才会为它赋值）
                    Object.defineProperty(this, key, {
                        get() { return field.value },
                        enumerable: true,
                        configurable: true,
                    })

                    field.bind(this, key)
                    field.process()
                }
            }

            validate() {
                this.errors = {} 
                let success = true
                for (const [key, field] of Object.entries(this._fields)) {
                    const ok = field.validate()
                    if (!ok) {
                        this.errors[key] = field.errors
                        success = false
                    } 
                } 
                return success
            }
        }
        // mixin(subCls.prototype, proto, false)
        return subCls
    }
}