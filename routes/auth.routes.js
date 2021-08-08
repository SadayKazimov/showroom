const router = require('express').Router()
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { signupSchema, signinSchema, forgotEmailSchema, forgotPassSchema, confirmSchema } = require('../validation/joi')
const { mailSender } = require('../utility/nodemail')
require('dotenv').config()



const genAcsToken = (user) => { return jwt.sign({ sub: user.id }, process.env.ACS_TKN_SCT, { expiresIn: process.env.ACS_TKN_EXP }) }
const genRfsToken = (user) => { return jwt.sign({ sub: user.id }, process.env.RFS_TKN_SCT, { expiresIn: process.env.RFS_TKN_EXP }) }



router.post('/signup', async (req, res) => {

    const { error } = signupSchema.validate(req.body)
    if (error) return res.status(400).json({ error: error.details[0].message })

    const email = await User.findOne({ email: req.body.email })
    if (email) return res.status(409).json({ error: 'Email already exists' })

    const salt = await bcrypt.genSalt(10)
    const hash = await bcrypt.hash(req.body.password, salt)

    const user = new User({
        username: req.body.username,
        email: req.body.email,
        password: hash
    })

    try {
        const savedUser = await user.save()

        const acsToken = genAcsToken(user)
        const rfsToken = genRfsToken(user)

        User.findByIdAndUpdate(user.id, { $set: { refreshTokens: rfsToken } }).exec()

        res.json({ success: true, acsToken, rfsToken })
    } catch (err) {
        res.status(500).json({ success: false })
    }
})





router.post('/signin', async (req, res) => {

    const { error } = signinSchema.validate(req.body)
    if (error) return res.status(400).json({ error: error.details[0].message })

    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.status(400).json({ error: 'Email not found' })

    const validPass = await bcrypt.compare(req.body.password, user.password)
    if (!validPass) return res.status(400).json({ error: 'Invalid Password' })

    try {
        const acsToken = genAcsToken(user)
        const rfsToken = genRfsToken(user)

        User.findByIdAndUpdate(user.id, { $set: { refreshTokens: rfsToken } }).exec()

        res.json({ success: true, acsToken, rfsToken })
    } catch (err) {
        res.status(500).json({ success: false })
    }
})





router.post('/forgot/email', async (req, res) => {

    const { error } = forgotEmailSchema.validate(req.body)
    if (error) return res.status(400).json({ error: error.details[0].message })

    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.status(400).json({ error: 'Email not found' })

    try {
        const confirmationCode = Math.floor(100000 + Math.random() * 900000).toString()
        User.findOneAndUpdate({ email: req.body.email }, { $set: { "confirmation.code": confirmationCode } }).exec()
        mailSender(req.body.email, 'Forgot Password', `Your confirmation code: ${confirmationCode}`)

        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ success: false })
    }
})





router.post('/forgot/password', async (req, res) => {

    const { error } = forgotPassSchema.validate(req.body)
    if (error) return res.status(400).json({ error: error.details[0].message })

    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.status(400).json({ error: 'Email not found' })

    const validPass = await bcrypt.compare(req.body.password, user.password)
    if (validPass) return res.status(400).json({ error: 'New password should be different from old one' })

    if (user.confirmation.token !== req.body.confirmationToken) return res.status(400).json({ error: 'Confirmation token is incorrect' })

    try {
        const salt = await bcrypt.genSalt(10)
        const hash = await bcrypt.hash(req.body.password, salt)
        User.findOneAndUpdate({ email: req.body.email }, { $set: { password: hash, confirmation: {} } }).exec()

        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ success: false })
    }
})





router.post('/confirmation', async (req, res) => {

    const { error } = confirmSchema.validate(req.body)
    if (error) return res.status(400).json({ error: error.details[0].message })

    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.status(400).json({ error: 'Email not found' })

    const confCode = req.body.code.replace(/\s/g, '')
    if (user.confirmation.code !== confCode) return res.status(409).json({ error: 'Code is incorrect' })

    try {
        const confirmationToken = crypto.randomBytes(8).toString('hex')
        User.findOneAndUpdate({ email: req.body.email }, { $set: { confirmation: { token: confirmationToken } } }).exec()

        res.json({ success: true, confirmationToken })
    } catch (err) {
        res.status(500).json({ success: false })
    }
})





router.post('/refresh', async (req, res) => {

    const { rfsToken } = req.body
    if (!rfsToken) return res.status(400).json({ error: 'Token is required' })

    try {
        const payload = jwt.verify(rfsToken, process.env.RFS_TKN_SCT)
        const acsToken = genAcsToken({ id: payload.sub })
        res.json({ success: true, acsToken })
    }
    catch (error) { return res.status(401).json({ error: error.message }) }
})





router.post('/signout', async (req, res) => {

    const { rfsToken } = req.body
    if (!rfsToken) return res.status(400).json({ error: 'Token is required' })

    try {
        const payload = jwt.verify(rfsToken, process.env.RFS_TKN_SCT)
        const user = await User.findById(payload.sub)
        const refreshTokens = user.refreshTokens.filter(t => t !== rfsToken)
        User.findByIdAndUpdate(payload.sub, { $set: { refreshTokens } }).exec()
        res.json({ success: true })
    }
    catch (error) { return res.status(401).json({ error: error.message }) }
})




module.exports = router