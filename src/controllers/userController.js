const userModel = require('../models/userModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const ObjectId = require("mongoose").Types.ObjectId;
const saltRounds = 10


const isValid = function (value) {
    if (typeof (value) === undefined || typeof (value) === null) { return false }
    if (typeof (value) === "string" && (value).trim().length > 0) { return true }
}

const userCreation = async function(req, res){
    try {
        
        let data = req.body;

        if (Object.keys(data) == 0) {
            return res.status(400).send({ status: false, message: "Please enter your details to register" })
        }

        let { fname, lname, email, phone, password,} = data

        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: "fname is required" })
        }
        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: "lname is required" })
        }
        if (!isValid(email)) {
            return res.status(400).send({ status: false, message: "email is required" })
        }

       
        const uniqueEmail = await userModel.findOne({ email })
        if (uniqueEmail) {
            return res.status(400).send({status: false, message: `${email} is alraedy in use. Please try another email Id.`})
        }

        if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)){
            return res.status(400).send({ status: false, message: "Invalid Email id." })
        }

        if(phone){
            const UniquePhone = await userModel.findOne({ phone })
           
            if (UniquePhone) {
                return res.status(400).send({status: false, message: `${phone} is already in use, Please try a new phone number.`})
            }
            if (!(/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone))){
             return res.status(400).send({ status: false, message: "Phone number must be a valid Indian number." })
            }
        }

        if(password)
        if(password.length < 8 || password.length > 15) {
            return res.status(400).send({ status: false, message: "Password must be of 8-15 letters." })
        }

        const encryption = await bcrypt.hash(password, saltRounds) //encrypting password by using bcrypt.
        userData = { fname, lname, email, phone, password: encryption}
        const saveUserData = await userModel.create(userData);
        return res.status(201).send({status: true, message: "user created successfully.",data: saveUserData});
    } 
    catch (err) {
        return res.status(500).send({status: false, msg: err.message})
    }
}




//------------------------------------------USER LOGIN-------------------------------------------------//

const userLogin = async function(req, res) {
    try {
        const data = req.body;

        if (Object.keys(data) == 0) {
            return res.status(400).send({ status: false, message: "Please enter your login credentials" })
        }
        
        const { email, password } = data;

        if (!isValid(data.email)) {
            return res.status(400).send({ status: false, message: 'Email Id is required' })
        }

        if (!isValid(data.password)) {
            return res.status(400).send({ status: false, message: 'Password is required' })
        }

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.status(401).send({ status: false, message: `Login failed! email id is incorrect.` });
        }

        let Password = user.password
        const encryption = await bcrypt.compare(password, Password) //Comparing normal password to the hashed password.

        if (!encryption) {
        return res.status(401).send({ status: false, message: `Login failed! password is incorrect.` });
        }
        const userId = user._id
        const token = jwt.sign({
            userId: userId,
            iat: Math.floor(Date.now() / 1000), 
            exp: Math.floor(Date.now() / 1000) + 3600 * 24 * 7 
        }, 'Secrete-key')

        return res.status(200).send({status: true, message: "User Login Successfull ", data: { userId, token}});
    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}




//-----------------------------------------------GET PROFILE-------------------------------------------------//


const getProfile = async function(req, res){
    try {
        const userId = req.params.userId
        const userIdFromToken = req.userId
    
        if (!ObjectId.isValid(userId)) {
            return res.status(400).send({ status: false, message: "Invalid userId in params." })
        }

        const UserDetails = await userModel.findOne({ _id: userId })
        if (!UserDetails) {
            return res.status(400).send({ status: false, message:"User doesn't exists"})
        }

        if (UserDetails._id.toString() != userIdFromToken) {
            return res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });
        }

         return res.status(200).send({ status: true, message: "Profile found successfully.", data: UserDetails })
    } 
    catch (err) {
        return res.status(500).send({status: false, message: "Error is: " + err.message})
    }
}




//------------------------------------------------UPDATE PROFILE-----------------------------------------------------//

const updateProfile = async function(req, res) {
    try {
        
        let data = req.body
        let userId = req.params.userId
        let userIdFromToken = req.userId

        if (!ObjectId.isValid(userId)) {
            res.status(400).send({ status: false, message: `${userId} is not a valid user id` })
            return
        }

        if (Object.keys(data) == 0) {
            return res.status(400).send({ status: false, message: "Please enter your details which you want to update" })
        }
        
        const user = await userModel.findOne({ _id: userId })
        if (!user) {
            return res.status(400).send({status: false, message: `User doesn't exists by ${userId}`})
        }

        if (user._id.toString() != userIdFromToken) {
            return res.status(401).send({ status: false, message: `Unauthorized access! User's info doesn't match` });    
        }

        let { fname, lname, email, phone } = data;

        if(fname){
        if (!isValid(fname)) {
            return res.status(400).send({ status: false, message: 'fname is Required' })
        }
        }

        if(lname){
        if (!isValid(lname)) {
            return res.status(400).send({ status: false, message: 'lname is Required' })
        }
        }
      
        if (email) {
            if (!isValid(email)) {
                return res.status(400).send({ status: false, message: "Invalid request parameter, please provide email" })
            }
            if (!/^\w+([\.-]?\w+)@\w+([\.-]?\w+)(\.\w{2,3})+$/.test(email)) {
                return res.status(400).send({ status: false, message: `Email should be a valid email address` });
            }
            let uniqueEmail = await userModel.findOne({ email: email })
            if (uniqueEmail) {
                return res.status(400).send({ status: false, message: `Unable to update email. ${email} is already registered.` });
            }
        }

        if (phone) {
            if (!/^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/.test(phone)) {
                return res.status(400).send({ status: false, message: `Please enter a valid Indian phone number.` });
            }
            let UniquePhone = await userModel.findOne({ phone: phone })
            if (UniquePhone) {
                return res.status(400).send({ status: false, message: `Unable to update phone. ${phone} is already registered.` });
            }
        }
        
        let changeProfileDetails = await userModel.findOneAndUpdate({ _id: userId }, {$set: { fname: fname, lname: lname, email: email,phone: phone} }, { new: true })

        return res.status(200).send({ status: true, data: changeProfileDetails })
    } 
    catch (err) {
        return res.status(500).send({status: false, message: "Error is: " + err.message})
    }
}

module.exports = {
    userCreation,
    userLogin,
    getProfile,
    updateProfile
}