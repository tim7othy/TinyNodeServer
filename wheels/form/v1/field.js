class Field {
    constructor(validators) {
        this.validators = validators
    }

    bind(form) {
        this.form = form
    }

    process(v) {
        this.data = v
    }
}

class IntField extends Field {
    process(v) {
        this.data = parseInt(v, 10)
    }
}

class StringField extends Field {
    process(v) {
        this.data = v
    }
}


module.exports = {
    Field,
    IntField,
    StringField,
}