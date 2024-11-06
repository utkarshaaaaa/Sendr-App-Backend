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
const corsOptions ={
    origin:'http://localhost:3000', 
    credentials:true,           
    optionSuccessStatus:200
}
app.use(cors(corsOptions));
//connection
moongose.connect('mongodb://127.0.0.1:27017/notes')



app.use('/',router)
console.log(short.generate());
app.listen(3001,()=>{
    console.log("App is running on port 3001")
})