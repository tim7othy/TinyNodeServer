class ValidationResult extends Error {
    constructor(pass, message) {
        super()
        this.pass = pass
        this.message = message
    }
}
function DataRequired(message="数据不可为空") {
    return (fieldValue) => {
        if (fieldValue) {
            return new ValidationResult(true)
        }
        return new ValidationResult(false, message)
    }
}
function Range(min, max, message="") {
    const msg = message || '数据范围应为' + min + " ~ " + max
    return (fieldValue) => {
        if (fieldValue > min && fieldValue < max) {
            return new ValidationResult(true)
        }
        return new ValidationResult(false, msg)
    }
}

module.exports = {
    ValidationResult,
    DataRequired,
    Range,
}