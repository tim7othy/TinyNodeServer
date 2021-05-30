class Field {
    constructor(validators = [], name = "") {
        this.name = name
        this.validators = validators
        this.errors = []
    }

    bind(form, attr) {
        this.form = form
        this.attr = attr
    }

    process() {
        const { formData } = this.form
        if (this.name
            && Object.keys(formData).includes(this.name)) {
            this.processData(formData[this.name])
        } else {
            this.processData(formData[this.attr])
        }
    }

    processData(data) {
        this.rawData = data
    }

    getValidateMethods() {
        let properties = new Set()
        let currentObj = this.form
        do {
            Object.getOwnPropertyNames(currentObj).forEach(item => properties.add(item))
        } while ((currentObj = Object.getPrototypeOf(currentObj)))
        return [...properties.keys()].filter(item => (
            typeof this.form[item] === 'function'
            && /^validate(?:[a-zA-Z_][a-zA-Z0-9_]+)$/g.test(item)
        ))
    }

    validate() {
        const validateFuncNames =  this.getValidateMethods()
        for (const vName of validateFuncNames) {
            const validateAttr = vName.replace(/validate([a-zA-Z_][a-zA-Z0-9_]+)/g, '$1').toLowerCase()
            if (this.name === validateAttr || this.attr === validateAttr) {
                const res = this.form[vName](this.rawData)
                if (!res.pass) {
                    this.errors.push(res.message)
                }
            }
        }
        for (const v of this.validators) {
            const res = typeof (v) === 'function' && v(this.rawData)
            if (res && !res.pass) {
                this.errors.push(res.message)
            }
        }
        return this.errors.length === 0
    }
}

class IntField extends Field {
    processData(v) {
        this.rawData = parseInt(v, 10)
    }
}

class StringField extends Field {
    processData(v) {
        this.rawData = v
    }
}
module.exports = {
    Field,
    IntField,
    StringField
}