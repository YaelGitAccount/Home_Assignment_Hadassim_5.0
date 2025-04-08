const express= require('express')
const router = express.Router()
const {checkUserType}=require('../controllers/loginController')
router.post('/',checkUserType)
module.exports = router