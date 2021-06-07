class FormValidationError extends Error {
    constructor(msgs) {
        super()
        this.msgs = msgs;
    }
}

module.exports = {
    FormValidationError,
}