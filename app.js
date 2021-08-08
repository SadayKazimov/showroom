const express = require('express')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config()
const app = express()
app.use(express.json())


mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true },
    () => {
        console.log('Connected to DB')
        return app.listen(process.env.PORT, () => { console.log('Server Started') })
    }
)



app.use('/api/auth', require('./routes/auth.routes'))