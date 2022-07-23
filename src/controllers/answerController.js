const userModel = require("../models/userModel");
const questionModel = require("../models/questionModel");
const answerModel = require("../models/answerModel");
const ObjectId = require("mongoose").Types.ObjectId;


const isValid = function (value) {
  if (typeof (value) === undefined || typeof (value) === null) { return false }
  if (typeof (value) === "string" && (value).trim().length > 0) { return true }
}


const postAnswers = async function (req, res) {
  try {
    let data = req.body;
    let userIdFromToken = req.userId;
    const { questionId, answeredBy, text } = data; 

    if (Object.keys(data).length == 0) {
      return res.status(400).send({status: false, message: "Please provide answer details in request body."});
    }
   
    if (!ObjectId.isValid(questionId)) {
      return res.status(400).send({status: false, message:"It is not a valid question id"});
    }
   
    if (!ObjectId.isValid(answeredBy)) {
      return res.status(400).send({status: false, message: "Not a valid usedId"});
    }
    
    if (!isValid(text)) {
      return res.status(400).send({status: false, message: `Text is required`});
    }
    if (answeredBy != userIdFromToken) {
      return res.status(401).send({status: false, message: `Unauthorized access! ${answeredBy} is not a logged in user.`});
    }
 
    const findUser = await userModel.findOne({ _id: answeredBy });
    if (!findUser) {
      return res.status(400).send({ status: false, message: "User not found." });
    }
    
    const findQuestion = await questionModel.findOne({_id: questionId,isDeleted: false,});
    if (!findQuestion) {
      return res.status(400).send({status: false, message: "Either question doesn't exist or deleted."});
    }
    
    if (findQuestion.askedBy == answeredBy) {
      return res.status(400).send({status: false, message: "User can't answer thier own question."});
    }

    const saveAnswer = await answerModel.create(data);
    
    await userModel.findOneAndUpdate({ _id: answeredBy },{ $inc: { creditScore: 200 } });

    return res.status(201).send({status: true, message: "Question answered successfully.", data: saveAnswer});
  } 
   catch (err) {
    return res.status(500).send({status: false, msg: err.message});
  }
};



//----------------------------------------------UPDATE ANSWER------------------------------------------------------//
const updateAnswer = async function(req, res) {
  try {
    const data = req.body;
    const answerId = req.params.answerId;
    const userIdFromToken = req.userId;
    let { text } = data;
   
    if (Object.keys(data).length == 0) {
      return res.status(400).send({status: false, message: "Please provide answer details in request body."});
    }
   
  
    if (!isValid(answerId)) {
      return res.status(400).send({ status: false, message: "This id is not a valid id" });
    }
    
    const findAnswer = await answerModel.findOne({ _id: answerId, isDeleted: false});
    if (!findAnswer) {
      return res.status(400).send({ status: false, message: "answer not found" });
    }

    let answeredBy = findAnswer.answeredBy;
    if (answeredBy != userIdFromToken) {
      return res.status(401).send({status: false, message: "Unauthorized access! answerBy ID is not a logged in user."});
    }

    if (!isValid(text)) {
      return res.status(400).send({status: false, message: " Please provide the text to update."});
    }
    const updatedAnswer = await answerModel.findOneAndUpdate({ _id: answerId },{ text: text },{ new: true });
   
    return res.status(200).send({status: true, message: "Answer updated successfully", data: updatedAnswer,});
  }
   catch (err) {
    return res.status(500).send({ status: false, msg: err.message });
  }
};



//--------------------------------------------------GET ALL ANSWERS-------------------------------------------------------//
const getAllAnswers = async function(req, res) {
  try {
    let questionId = req.params.questionId;
    if (!ObjectId.isValid(questionId)) {
      return res.status(400).send({status: false, message: "It is not a valid question id in URL params."});
    }
    const searchQuestion = await questionModel.findOne({ _id: questionId });
    if (!searchQuestion) {
      return res.status(404).send({status: false, message: "Question doesn't exists or has been deleted."});
    }
    const fetchAnswers = await answerModel.find({ questionId: questionId }).select({ createdAt: 0, updatedAt: 0, __v: 0 });
   
    if (Array.isArray(fetchAnswers) && fetchAnswers.length === 0) {
      return res.status(404).send({status: false, message: `No answers found for ${questionId} this question.`});
    }

    return res.status(200).send({status: true, message: `Answer fetched successfully.`, data: fetchAnswers});
  }
   catch (err) {
    return res.status(500).send({status: false,  Error: err.message,});
  }
};





//--------------------------------------------------------DELETE ANSWER-----------------------------------------------------//


const deleteAnswers = async function (req, res) {
  try {
   
    const answerId = req.params.answerId;
    const userIdFromToken = req.userId;
    let data = req.body;
    const { answeredBy, questionId } = data;
  
    if (Object.keys(data).length == 0) {
      return res.status(400).send({status: false, message: "Please provide answer details in request body."});
    }
  
    if (!ObjectId.isValid(answerId)) {
      return res.status(400).send({status: false, message: "It is not a valid answer id"});
    }

    if (!ObjectId.isValid(answeredBy)) {
      return res.status(400).send({status: false, message: "It is not a valid answeredBy id"});
    }
 
    if (!ObjectId.isValid(questionId)) {
      return res.status(400).send({status: false, message: "questionId is required to delete the answer."});
    }
    
    if (answeredBy != userIdFromToken) {
      return res.status(401).send({status: false, message:"Unauthorized access! It is not a logged in user."});
    }
    
    const findAnswer = await answerModel.findOne({_id: answerId, isDeleted: false});
    if (!findAnswer) {
      return res.status(404).send({status: false, message: "No answer exists or has been already deleted.`"});
    }
    
     if (findAnswer.answeredBy != answeredBy) {
      return res.status(400).send({status:false, message: "Unable to delete the answer because it is not answered by you."})
    }
    
    if (findAnswer.answeredBy == answeredBy) {
      await answerModel.findOneAndUpdate({ _id: answerId }, { $set: { isDeleted: true } });
    }
    return res.status(200).send({ status: true, message: `Answer deleted successfully.` });
  } 
  catch (err) {
    return res.status(500).send({status: false, message: err.message });
  }
};

module.exports = {
  postAnswers,
  getAllAnswers,
  updateAnswer,
  deleteAnswers,
};
