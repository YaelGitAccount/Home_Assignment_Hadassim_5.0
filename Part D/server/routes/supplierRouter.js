const express= require('express')
const router = express.Router()
const {createSupplier,getSuppliersByProduct,getSuppliers,getProducstBySupplier}=require('../controllers/supplierController')

router.post('/', createSupplier)
router.get('/:productName', getSuppliersByProduct)
router.get('/allSuppliers/:_id', getSuppliers)
router.get('/getProducstBySupplier/:_id', getProducstBySupplier)

module.exports = router