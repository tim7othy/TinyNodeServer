class Converter {
    constructor() {
        this.regex = '[^\\/]+'
    }
    toValue(s) {
        return s
    }
}

class IntConverter extends Converter {
    constructor() {
        super()
        this.regex = '\\d+'
    }
    toValue(s) {
        return parseInt(s, 10)
    }
}

class FloatConverter extends Converter {
    constructor() {
        super()
        this.regex = '\\d+\\.\\d+'
    }
    toValue(s) {
        return parseFloat(s)
    }
}

module.exports = {
    Converter,
    IntConverter,
    FloatConverter,
}