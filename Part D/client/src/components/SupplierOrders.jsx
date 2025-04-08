import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const SupplierOrders = () => {
    const { supplierId } = useParams();
    console.log(supplierId)

    const [orders, setOrders] = useState([]);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const fetchOrders = async () => {
        try {
            const response = await axios.get(`http://localhost:8888/api/orders/${supplierId}`);
            setOrders(response.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (supplierId) {
            fetchOrders();
        }
    }, [supplierId]);

    const handleApprove = async (orderId) => {
        try {

            const res = await axios.put(`http://localhost:8888/api/orders/setOrderToInProgress/${supplierId}/${orderId}`);
            setSuccessMessage("The order was successfully confirmed.");
            // Refresh the order list after an update
            fetchOrders();
        } catch (err) {
            console.error(err);
            setError('The order cannot be confirmed. Make sure it is in a valid status');
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Your orders</h2>

            {error && <p className="text-red-500">{error}</p>}
            {successMessage && <p className="text-green-600">{successMessage}</p>}

            {orders.length === 0 ? (
                <p>No orders yet...</p>
            ) : (
                <ul className="space-y-4">
                    {orders.map((order) => (
                        <li key={order._id} className="border p-4 rounded shadow">
                            <p><strong>order number:</strong> {order._id}</p>
                            <p><strong>status:</strong> {order.status}</p>
                            <p><strong> product Name:</strong> {order.productName}</p>
                            <p><strong>quantity:</strong> {order.quantity} </p>

                            {order.status === 'pending' && (
                                <button
                                    onClick={() => handleApprove(order._id)}
                                    className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                                >
                                Confirm order                                
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default SupplierOrders;