const mongoose = require('mongoose');
const Supplier = require("../models/Supplier")

const orderSchema = new mongoose.Schema({
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true }, 
    productName: { type: String, required: true },
    quantity: { type: Number, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'in progress', 'completed'], 
        required: true, 
        default: 'pending' 
    }
});
module.exports=mongoose.model('Order',orderSchema)