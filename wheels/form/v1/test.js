const FormMeta = require('./meta')
const { Field, IntField, StringField } = require('./field')

class UserForm {
    static nameField = new StringField()
    static ageField = new IntField()
}

const FormCls = FormMeta.SchemaForm(UserForm)

// console.log(FormCls._schema)
const f = new FormCls()
f.init({name: 'tim', age: '12'})
console.log('name: ', f.name.data)
console.log('age: ', f.age.data)
