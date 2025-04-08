require('dotenv').config()
const cors = require('cors')
const express = require('express')
const corsOptions = require('./config/corsOptions')
const connectDB = require("./config/dbConn")
const mongoose = require('mongoose')
const app = express()
app.use(cors(corsOptions))
app.use(express.json())
connectDB()
const PORT = process.env.PORT || 1003
app.use("/api/suppliers",require('./routes/supplierRouter'))
app.use("/api/login",require('./routes/loginRouter'))
app.use("/api/orders",require('./routes/orderRouter'))
mongoose.connection.once('open', () => {
    console.log('connected to MongoDB')
    app.listen(PORT, () => console.log(`server running on ${PORT}`))
})
mongoose.connection.on('error', err => {
    console.log(err)
})



