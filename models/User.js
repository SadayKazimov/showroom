const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    date: { type: Date, default: Date.now() },
    refreshTokens: { type: Array },
    confirmation: {
        token: { type: String },
        code: { type: String }
    }
})


module.exports = mongoose.model('User', userSchema)