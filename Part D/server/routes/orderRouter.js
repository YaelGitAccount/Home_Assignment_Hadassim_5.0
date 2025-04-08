const express= require('express')
const router = express.Router()
const {createOrder,completeOrder,getOrders,setOrderToInProgress}=require('../controllers/orderController')

router.post('/:_id', createOrder)
router.put('/:_id/:orderId',completeOrder)
router.put('/setOrderToInProgress/:_id/:orderId',setOrderToInProgress)
router.get('/:_id',getOrders)
module.exports = router