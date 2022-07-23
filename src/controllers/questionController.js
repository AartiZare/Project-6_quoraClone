const userModel = require("../models/userModel");
const questionModel = require("../models/questionModel");
const answerModel = require("../models/answerModel");
const ObjectId = require("mongoose").Types.ObjectId;


const isValid = function (value) {
  if (typeof (value) === undefined || typeof (value) === null) { return false }
  if (typeof (value) === "string" && (value).trim().length > 0) { return true }
}


const postQuestion = async function(req, res){
  try {
    let data = req.body;
    const userIdFromToken = req.userId;
 
    if (Object.keys(data).length == 0) {
      return res.status(400).send({ status: false, message: "Please enter question details" })
    }

    let { description, tag, askedBy } = data

    if (!ObjectId.isValid(askedBy)) {
     return res.status(400).send({status: false, message: "askedBy is required to post a question."});
    }

    if (askedBy != userIdFromToken) {
      return res.status(401).send({status: false, message: `Unauthorized access! User's info doesn't match`});
    }

    if (!isValid(description)) {
      return res.status(400).send({status: false, message: "Question description is required."});
    }

    const isQuestionAlreadyAsked = await questionModel.find(

        {
            description: description,
            askedBy: askedBy
        }

    )

    if (isQuestionAlreadyAsked.length !== 0) {
        return res.status(409).send({status:false, msg: "You've already askend this similar question"})
    }

    const checkCreditScore = await userModel.findById(userIdFromToken)

    if (checkCreditScore.creditScore <= 0) {
      return res.status(400).send({status: false, msg: "You can't ask questions anymore"})
    }

    await userModel.findByIdAndUpdate(userIdFromToken, { $inc: { creditScore: -100 } })

    if (tag) {
        if (!Array.isArray(tag)) {
          return res.status(400).send({status: false, msg:"please enter valid tags"})
        }
    }

    let queData = {
        description,
        tag,
        askedBy
    }

    const newQuestion = await questionModel.create(queData)
    return res.send({status: true, msg: 'Success', data: newQuestion})
    } 
    catch (err) {
      return res.status(500).send({ Error: err.message });
    }
  };




//------------------------------------GET ALL QUESTIONS---------------------------------------//



    const getAllQuestions = async function(req, res){
        try {

          const serachParams = req.query
          const filterQuery = { isDeleted: false }
          const sortQuery = {}
  
          let { tag, sort } = serachParams
  
          if ('tag' in serachParams) {
              if (isValid(tag)) {
                  const tagsArr = tag.trim().split(',').map(tag => tag.trim())
                  filterQuery['tag'] = { $all: tagsArr }
              }
          }
  
          if ('sort' in serachParams) {
              if (isValid(sort)) {
                  if (sort == 'ascending') {
                      sortQuery['createdAt'] = 1
                  }
                  if (sort == 'decending') {
                      sortQuery['createdAt'] = -1
                  }
                }
          }
  
          const fetchData = await questionModel.find(filterQuery).sort(sortQuery).select({ description: 1, tag: 1, askedBy: 1 }).lean()
  
          for (let elm of fetchData) {
              let answers = await answerModel.find({ questionId: elm._id, isDeleted: false }).sort({ createdAt: -1 }).select({ answeredBy: 1, text: 1 })
              elm['answers'] = answers
          }
        return res.status(200).send({status: true, message: "Question fetched successfully.", data: data});
      } 
      catch (err) {
        return res.status(500).send({ status: false, message: err.message });
      }
};





//---------------------------------------------------GET QUESTIONS BY ID---------------------------------------------------//


const getQuestionById = async function (req, res) {
  try {
    const questionId = req.params.questionId;

    if (!ObjectId.isValid(questionId)) {
      return res.status(400).send({status: false, message: "This is not a valid question id"});
    }
    const findQuestion = await questionModel.findOne({_id: questionId, isDeleted: false});
    
    if (!findQuestion) {
      return res.status(404).send({status: false,message: "There is no question exist with this question id"});
    }
    const findAnswersOfThisQuestion = await answerModel.find({ questionId: questionId }).sort({ createdAt: -1 }).select({ createdAt: 0, updatedAt: 0, __v: 0 });
    
    const description = findQuestion.description;
    const tag = findQuestion.tag;
    const askedBy = findQuestion.askedBy;
    
    const structureForResponseBody = {
      description,
      tag,
      askedBy,
      answers: findAnswersOfThisQuestion,
    };
    return res.status(200).send({status: true, message: "Question fetched successfully.", findQuestion: structureForResponseBody });
  } 
  catch (error) {
    return res.status(500).send({ status: false, message: "Error is : " + error });
  }
};



//--------------------------------------------------UPDATE QUESTIONS-------------------------------------------------------//


const updateQuestion = async function(req, res){

  try {

      if (Object.keys(req.body).length == 0) {
          return res.status(400).send({status: false, msg:" request Body Should Not Be Empty"})
      }

      const data = req.body
      const userIdFromToken = req.userId
      let questionId = req.params.questionId

      if (!questionId) {
          return res.status(400).send({status: false, msg:" provide question id in request params"})
      }

      if (!ObjectId.isValid(questionId)) {
          return res.status(400).send({status: false, msg:"Provide valid question id"})
      }

      const isQuestionExist = await questionModel.findOne({ _id: questionId, isDeleted: false })

      if (!isQuestionExist) {
          throw createError(400, `cant Find Question You Want To Update`)
      }

      if (userIdFromToken != isQuestionExist.askedBy) {
          throw createError(401, `The resource you are trying To update doesnot belongs To you`)
      }

      let updateQuery = {}

      let { description, tag } = data

      if ('description' in data) {

          if (!isValid(description)) {
              return res.status(400).send({status: false, msg:"Please provide valid description"})
          }

          if (!updateQuery.hasOwnProperty('$set')) {
              updateQuery['$set'] = {}
          }

          updateQuery['$set']['description'] = description.trim()

      }

      if ('tag' in data) {

          if (Array.isArray(tag)) {

              let tagArr = tag.map(e => e.trim())

              if (!updateQuery.hasOwnProperty('$addToSet')) {
                  updateQuery['addToSet'] = {}
              }

              updateQuery['$addToSet'] = { tag: { $each: [...tagArr] } }


          } else {

              if (!isValid(tag)) {
                  throw createError(400, `Please Enter Valid Tags To Update`)
              }
              let tagArr = tag.trim().split(',').map(e => e.trim())

              if (!updateQuery.hasOwnProperty('$addToSet')) {
                  updateQuery['addToSet'] = {}
              }

              updateQuery['$addToSet'] = { tag: { $each: tagArr } }

          }

      }

      let updatedData = await questionModel.findByIdAndUpdate(questionId, updateQuery, { new: true })

      return res.status(200).send({status: true, msg: "Successfully updated", data: updatedData})

  }
   catch (error) {
    return res.status(500).send({ status: false, msg: error.message });
  }
}


//-------------------------------------------------DeleteByQuestionId--------------------------------------------------//


const deleteQuestions = async function(req, res, next){
  try {

      const questionId = req.params.questionId
      const userIdFromToken = req.userId

      if (!questionId) {
        return res.status(400).send({status: false, msg: "Please provide question id in request params"})
      }

      if (!ObjectId.isValid(questionId)) {
          throw createError(400, `${questionId} is Not a valid Question Id`)
      }

      const isQuestionExist = await questionModel.findOne({ _id: questionId, isDeleted: false })

      if (!isQuestionExist) {
          return res.status(404).send({status: false, msg:"Ths question is already deleted"})
      }

      if (userIdFromToken != isQuestionExist.askedBy) {
          return res.status(401).send({status: false, msg:"The question you're trying to delete doesn't belong to you"})
      }

      await questionModel.findOneAndUpdate(
          { questionId },{ isDeleted: true, deletedAt: Date.now() }
      )
      return res.status(200).send({status: false, msg: "Question deleted successfully"})
  }
   catch (error) {
    return re.status(500).send({status: false, msg: error.message})
  }
}


module.exports = {
  postQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestions,
};
