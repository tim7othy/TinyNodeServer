const form = exports = module.exports = {}

form.init = function init(formData) {
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

form.validate = function validate() {
    this.errors = {} 
    for (const [key, field] of Object.entries(this._fields)) {
        const succuss = field.validate()
        if (!succuss) {
            this.errors[key] = field.errors
        } 
    } 
    return true
}
