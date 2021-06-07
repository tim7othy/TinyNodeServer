const FormMeta = require('./meta')
const { IntField, StringField } = require('./field')
const { DataRequired, Range, ValidationResult } = require('./validators')

class UserForm {
    static nameField = new StringField([
        DataRequired("姓名数据必填！")
    ])
    static ageField = new IntField([
        Range(0, 5)
    ])

    // validateAge(data) {
    //     if (data > 12) return new ValidationResult(true)
    //     return new ValidationResult(false, "age is less than 12")
    // }
}


const main = async () => {
    const FormCls = FormMeta.SchemaForm(UserForm)
    const form = new FormCls()
    form.init({
        name: 'tim',
        age: 15
    })
    try {
        await form.validate()
    } catch (err) {
        console.log(err.msgs)
    }
    console.log('name: ', form.name)
    console.log('age: ', form.age)
}

main()
