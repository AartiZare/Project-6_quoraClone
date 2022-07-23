const express = require('express');
const router = express.Router();


const userController = require('../controllers/userController')
const questionController = require('../controllers/questionController')
const answerController = require('../controllers/answerController')
const auth = require('../auth/auth')


router.post('/register', userController.userCreation)
router.post('/login', userController.userLogin)
router.get('/user/:userId/profile', auth.authentication, userController.getProfile)
router.put('/user/:userId/profile', auth.authentication, userController.updateProfile)


router.post('/question',auth.authentication, questionController.postQuestion)
router.get('/questions', questionController.getAllQuestions)
router.get('/questions/:questionId', questionController.getQuestionById)
router.put('/questions/:questionId', auth.authentication,questionController.updateQuestion)
router.delete('/questions/:questionId', auth.authentication, questionController.deleteQuestions)


router.post('/answer', auth.authentication, answerController.postAnswers)
router.get('/questions/:questionId/answer',  answerController.getAllAnswers)
router.put('/answer/:answerId', auth.authentication,  answerController.updateAnswer)
router.delete('/answers/:answerId', auth.authentication,  answerController.deleteAnswers)


module.exports = router;