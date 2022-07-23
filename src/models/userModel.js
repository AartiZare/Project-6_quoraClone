const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        fname: { 
            type: String,
            required: true, 
            trim: true
         },
         lname: {
            type: String,
            required: true,
            trim: true
         },
        email: {
            type: String, 
            unique: true, 
            required: true, 
            trim: true 
        },
        phone: {
            type: Number, 
            unique: true 
        },
        password: { 
            type: String, 
            required: true 
        }, // encrypted password
        creditScore :{
            type:Number,
            default:500
        }
   
}, { timestamps: true })

module.exports = mongoose.model('user', userSchema)