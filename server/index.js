const express=require('express')
const coolkieSession=require('cookie-session')
const passport=require('passport')
const router=require('./routes/router')
const cors=require('cors')
const short = require('short-uuid');

// Quick start with flickrBase58 format
 // Example: 73WakrfVbNJBaAmhQtEeDv
const moongose=require('mongoose')
const app=express()


app.use(express.json());

app.use(cors())
//connection
moongose.connect('mongodb://127.0.0.1:27017/notes')

app.use('/',router)
console.log(short.generate());
app.listen(3001,()=>{
    console.log("app is running")
})