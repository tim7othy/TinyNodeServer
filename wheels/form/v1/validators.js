class ValidationResult extends Error {
    constructor(pass, message) {
        super()
        this.pass = pass
        this.message = message
    }
}
function DataRequired(message="") {
    return (fieldValue) => {
        if (fieldValue) {
            return new ValidationResult(true)
        }
        return new ValidationResult(false, message)
    }
}

module.exports = {
    ValidationResult,
    DataRequired,
}