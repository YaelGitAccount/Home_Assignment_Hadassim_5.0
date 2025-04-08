
const Supplier = require("../models/Supplier")
const mongoose = require('mongoose')
const administrator = process.env.administrator


const createSupplier = async (req, res) => {
    try {
        const { companyName, phoneNumber, representativeName, products } = req.body;

        const phoneRegex = /^\+?\d+$/;
        if (!phoneNumber || !phoneRegex.test(phoneNumber)) {
            return res.status(400).json({ message: 'Invalid phone number. It can only contain numeric characters and +.' });
        }

        if (!companyName || !phoneNumber || !representativeName || !products || !Array.isArray(products) ||
            !products.every(item => typeof item === 'object' && item.productName && typeof item.productName === 'string' &&
                item.pricePerUnit && typeof item.pricePerUnit === 'number' && item.pricePerUnit > 0 && 
                item.minQuantity !== undefined && typeof item.minQuantity === 'number' && item.minQuantity >= 0)) { 
            return res.status(400).json({ message: 'All fields are required and products must be an array of valid objects with productName (string), pricePerUnit (positive number), and minQuantity (positive number or 0)' });
        }

        const existUser = await Supplier.findOne({ companyName }).lean();
        if (existUser) {
            return res.status(409).send('Company name already exists');
        }

        const newSupplier = await Supplier.create({ companyName, phoneNumber, representativeName, products });
        if (newSupplier) {
            res.status(201).json(newSupplier);
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};



//------------------------------------------------------------
const getSuppliersByProduct = async (req, res) => {
    try {
        const { productName } = req.params; 
        const { sortBy = 'price' } = req.query; // Getting sortBy from query, default is price

        if (!productName) {
            return res.status(400).json({ message: 'Product name is required' });
        }

        if (sortBy !== 'price' && sortBy !== 'quantity') {
            return res.status(400).json({ message: 'sortBy must be either "price" or "quantity"' });
        }

        // Get all suppliers that sell the specific product
        const suppliers = await Supplier.aggregate([
            { $unwind: "$products" },
            { $match: { "products.productName": productName } },
            {
                $project: {
                    companyName: 1,
                    phoneNumber: 1,
                    representativeName: 1,
                    "products.productName": 1,
                    "products.pricePerUnit": 1,
                    "products.minQuantity": 1
                }
            },
            {
                $sort: {
                    [`products.${sortBy === 'price' ? 'pricePerUnit' : 'minQuantity'}`]: 1, // Sort by price or quantity in ascending order
                    [`products.${sortBy === 'price' ? 'minQuantity' : 'pricePerUnit'}`]: 1 // Sort by the other field in ascending order
                }
            }
        ]);

        res.status(200).json(suppliers);

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
const getProducstBySupplier = async (req, res) => {
    const { _id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({ message: 'Invalid format ID' });
    }
    try {
        const producst = await Supplier.find({ _id },{products:1})
        if (!producst?.length) {
            return res.status(200).json({ message: 'No products found' })
        }
        return res.status(200).json(producst)

    } catch (error) {
        res.status(500).json({ message: 'Server error', error });

    }
}

const getSuppliers = async (req, res) => {
    const _id = req.params._id
    console.log(_id)

    if (!mongoose.Types.ObjectId.isValid(_id) && _id !== administrator) {
        console.log("suppliers")

        return res.status(400).json({ message: 'No access permission' });
    }
    try {
        const suppliers = await Supplier.find({}, { _id: 1, companyName: 1 })
        console.log(suppliers)
        if (!suppliers?.length) {
            return res.status(400).json({ message: 'No suppliers found' });

        }
        return res.status(200).json(suppliers);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
}
module.exports = { createSupplier, getSuppliersByProduct, getSuppliers ,getProducstBySupplier}