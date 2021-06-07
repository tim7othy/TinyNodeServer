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
        this.value = data
    }

    async check(v, data) {
        let res;
        if (typeof (v) === 'function') {
            res = await v(data)
        } else if (typeof (v) === 'string') {
            if (typeof (this.form[v]) === 'function') {
                res = await this.form[v](data)
            }
        }
        if (res && !res.pass) {
            this.errors.push(res.message)
        }
    }

    async validate() {
        const vName = 'validate' + (this.name || this.attr)[0].toUpperCase() + (this.name || this.attr).slice(1)
        await this.check(vName, this.value)
        for (const v of this.validators) {
            await this.check(v, this.value)
        }
        return this.errors.length === 0
    }
}

class IntField extends Field {
    processData(v) {
        this.value = parseInt(v, 10)
    }
}

class FloatField extends Field {
    processData(v) {
        this.value = parseFloat(v)
    }
}

class BooleanField extends Field {
    processData(v) {
        this.value = !!v
    }
}

class StringField extends Field {
    processData(v) {
        this.value = v
    }
}

module.exports = {
    Field,
    IntField,
    FloatField,
    BooleanField,
    StringField,
}