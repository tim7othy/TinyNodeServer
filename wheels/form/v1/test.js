const FormMeta = require('./meta')
const { IntField, StringField } = require('./field')
const { DataRequired, ValidationResult } = require('./validators')

class UserForm {
    static nameField = new StringField([
        DataRequired("姓名数据必填！")
    ])
    static ageField = new IntField()
    validateAge(data) {
        if (data > 12) return new ValidationResult(true)
        return new ValidationResult(false, "age is less than 12")
    }
}
const FormCls = FormMeta.SchemaForm(UserForm)
const form = new FormCls()
form.init({
    name: 'aaa',
    age: 1
})
const success = form.validate()
if (!success) {
    console.log(form.errors)
}