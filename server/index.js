const express=require('express')
require('dotenv').config()
const router=require('./routes/router')
const cors=require('cors')
const short = require('short-uuid');
const coolkieSession=require('cookie-session')
const passport=require('passport')

// Quick start with flickrBase58 format
 // Example: 73WakrfVbNJBaAmhQtEeDv
const moongose=require('mongoose')
const app=express()


app.use(express.json());

app.use(cors())
//connection
moongose.connect('mongodb://127.0.0.1:27017/notes')
app.use(
    coolkieSession({
        name:"session",
        keys:["cyberwolve"],
        maxAge:24*60*60*100, 
    })
)

app.use(passport.initialize())
app.use(passport.session())

app.use(
    cors({
        origin:"http://localhost:3001",
        methods:"GET,POST,PUT,DELETE",
        credentials:true
    })
 )

app.use('/',router)
console.log(short.generate());
app.listen(3001,()=>{
    console.log("app is running")
})