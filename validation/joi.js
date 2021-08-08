const Joi = require('joi')


const signupSchema = Joi.object({
    username: Joi.string().min(6).required(),
    email: Joi.string().email().required(),
    password: Joi.string().pattern(new RegExp(/^(((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])))(?=.{8,})/)).message({ "string.pattern.base": "Password is not valid" })
})

const signinSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().pattern(new RegExp(/^(((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])))(?=.{8,})/)).message({ "string.pattern.base": "Password is not valid" })
})

const forgotEmailSchema = Joi.object({
    email: Joi.string().email().required()
})

const forgotPassSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().pattern(new RegExp(/^(((?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])))(?=.{8,})/)).message({ "string.pattern.base": "Password is not valid" }),
    confirmationToken: Joi.string().required()
})

const confirmSchema = Joi.object({
    email: Joi.string().email().required(),
    code: Joi.string().pattern(new RegExp(/^(\d\s*){6}$/)).message({ "string.pattern.base": "Code is not valid" })
})


module.exports = {
    signupSchema, signinSchema, forgotEmailSchema, forgotPassSchema, confirmSchema
}