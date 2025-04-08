const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    companyName: { type: String, required: true, unique:true},
    phoneNumber: { type: String, required: true },
    representativeName: { type: String, required: true },
    products: [{
        productName: { type: String, required: true },
        pricePerUnit: { type: Number, required: true },
        minQuantity: { type: Number, required: true }
    }]
});
module.exports=mongoose.model('Supplier',supplierSchema)