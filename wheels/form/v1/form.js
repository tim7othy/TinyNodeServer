const form = exports = module.exports = {}

form.init = function init(formData) {
    this.formData = formData
    const keys = Reflect.ownKeys(this._schema)
    keys.forEach(k => {
        const field = this._schema[k]
        field.bind(this)
        this[k] = field
    })
    this.process()
}

form.process = function process() {
    const keys = Reflect.ownKeys(this.formData)
    keys.forEach(k => {
        const v = this.formData[k]
        const field = this._schema[k]
        field.process(v)
    })
}
