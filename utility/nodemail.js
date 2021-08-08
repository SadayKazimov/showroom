const nodemailer = require('nodemailer')
require('dotenv').config()


const mailSender = (receiver, subject, text) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.ND_USER,
            pass: process.env.ND_PASS
        }
    })


    let mailOptions = {
        from: process.env.ND_USER,
        to: receiver,
        subject: subject || 'Showroom',
        text: text || 'Copyright © 2021 Showroom™'
    }


    transporter.sendMail(mailOptions).then((data) => {
        console.log('Email received successfully by:', data.accepted)
    }).catch((error) => {
        console.log('Email could not send:', error)
    })
}


module.exports = { mailSender }