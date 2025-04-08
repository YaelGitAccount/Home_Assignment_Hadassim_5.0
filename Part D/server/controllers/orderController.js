
const Order = require("../models/Order")
const Supplier = require("../models/Supplier");
const mongoose = require('mongoose')
const administrator=process.env.administrator
const createOrder = async (req, res) => {
    const {_id}= req.params

    try {
    
        if(!_id || _id!==administrator)
        {
            return res.status(403).json({message: 'No access permission'})
        }
        const { supplierId, productName, quantity } = req.body;

        if (!supplierId || !productName || !quantity) {
            return res.status(400).json({ message: 'supplierId, productName and quantity are required' });
        }
        if (!mongoose.Types.ObjectId.isValid(supplierId)) {
            return res.status(400).json({ message: 'Invalid supplier ID' });
        }
        if (quantity <= 0) {
            return res.status(400).json({ message: 'Quantity must be a positive number' });
        }

        const supplier = await Supplier.findById(supplierId).lean();
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        const product = supplier.products.find(p => p.productName === productName);
        if (!product) {
            return res.status(404).json({ message: 'Product not found in supplier inventory' });
        }

        if (quantity < product.minQuantity) {
            return res.status(400).json({ message: `Quantity must be at least ${product.minQuantity}` });
        }

        const newOrder = await Order.create({
            supplier: supplierId,
            productName,
            quantity
            });

        res.status(201).json(newOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};
const completeOrder = async (req, res) => {

    try {
        const { orderId ,_id} = req.params;  
        console.log(orderId ,_id)

        if (!mongoose.Types.ObjectId.isValid(_id) && _id !==administrator) {
            return res.status(400).json({ message: 'Invalid format ID' });
            

        }

        if (_id !==administrator) {
            return res.status(403).json({ message: 'Access is unauthorized. Suppliers cannot change the status' });
        }
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid order ID' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }
        
        if (order.status === 'completed') {
            return res.status(400).json({ message: 'Order is already completed' });
        }

        if (order.status !== 'in progress') {
            return res.status(400).json({ message: 'Order must be in progress before it can be completed' });
        }

        order.status = 'completed';

        await order.save();

        return res.status(200).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error', error });
    }
};
const getOrders = async (req, res) => {
    try {
        const {_id} = req.params; 
        let filter = {};
        if(_id !==administrator)
        {
            if (!mongoose.Types.ObjectId.isValid(_id) ) {
                return res.status(400).json({ message: 'Invalid format ID' });
            }
            const supplier = await Supplier.findById(_id);
            if (!supplier) {
                return res.status(404).json({ message: 'Supplier not found' });
            }
            filter.supplier=_id
        }
   
        const { includeCompleted = 'false' } = req.query;

        const { sortBy = 'date' } = req.query;

        const { order = 'asc' } = req.query;

        if (sortBy !== 'date' && sortBy !== 'status' && sortBy !== 'supplier') {
            return res.status(400).json({ message: 'Invalid sortBy field. It should be "date", "status", or "supplier".' });
        }

        if (includeCompleted === 'false') {
            filter.status = { $ne: 'completed' }; 
        }

        const sortField = sortBy === 'date' ? 'createdAt' : sortBy;

        const sortOrder = order === 'desc' ? -1 : 1;

        const orders = await Order.find(filter)
                                  .sort({ [sortField]: sortOrder }) 
                                  .populate('supplier', 'companyName') 
                                  .exec();
        if (orders.length === 0) {
            return res.status(404).json({ message: 'No orders found matching the criteria.' });
        }

        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
};
const setOrderToInProgress = async (req, res) => {

    const { orderId,_id } = req.params;  
    try {
        if (!mongoose.Types.ObjectId.isValid(_id) ) {
            return res.status(400).json({ message: 'Invalid format ID' });
        }
        if(_id===administrator)
        {
            return res.status(403).json({ message: 'Access is unauthorized. Only suppliers can change the status' });
        }
        const supplier = await Supplier.findById(_id); 
        if (!supplier) {
            return res.status(403).json({ message: 'Access is unauthorized. Invalid supplier' });
        }
        
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ message: 'Invalid format ID' });
        }
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({ message: 'The status cannot be changed to completed if the order is not in pending status' });
        }
       
        order.status = 'in progress'; 
        await order.save();

        return res.status(200).json({ message: 'Status updated successfully', order });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Server error', error });
    }
};


module.exports = { createOrder,completeOrder, getOrders,setOrderToInProgress };
