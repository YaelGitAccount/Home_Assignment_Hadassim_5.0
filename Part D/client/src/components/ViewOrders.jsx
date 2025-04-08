// components/ViewOrders.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

const ViewOrders = () => {
    const { managerId } = useParams();  // מזהה של בעל המכולת מה-URL
    const [orders, setOrders] = useState([]); // כל ההזמנות
    const [filteredOrders, setFilteredOrders] = useState([]); // הזמנות להציג
    const [includeCompleted, setIncludeCompleted] = useState(false); // האם להציג הזמנות הושלמו
    const [error, setError] = useState('');

    const fetchOrders = async () => {
        try {
            const response = await axios.get(`http://localhost:8888/api/orders/${managerId}?includeCompleted=${includeCompleted}`);
            setOrders(response.data);
            setError('');
        } catch (err) {
            setOrders([]);
            setError(err.response?.data?.message || 'שגיאה בשליפת ההזמנות');
        }
    };

    const handleCompleteOrder = async (orderId) => {
        try {
            const response = await axios.put(`http://localhost:8888/api/orders/${managerId}/${orderId}`);
            // עדכון ההזמנה ברשימה לאחר שהסטטוס שונה ל"הושלמה"
            setOrders(orders.map(order => 
                order._id === orderId ? { ...order, status: 'completed' } : order
            ));
            // עדכון הרשימה המוצגת (לא תציג הזמנות שהסטטוס שלהן "הושלמה")
            setFilteredOrders(filteredOrders.filter(order => order._id !== orderId));
        } catch (err) {
            console.error('Error completing order:', err);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [includeCompleted]);

    useEffect(() => {
        // עדכון filteredOrders לפי includeCompleted
        if (includeCompleted) {
            setFilteredOrders(orders);
        } else {
            setFilteredOrders(orders.filter(order => order.status !== 'completed'));
        }
    }, [orders, includeCompleted]);

    return (
        <div className="card">
            <h2>Your orders</h2>
            <Button
                label={includeCompleted ? 'view only open orders' : 'view all orders'}
                onClick={() => setIncludeCompleted(!includeCompleted)}
                className="mb-3"
            />
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <DataTable value={filteredOrders} paginator rows={10} stripedRows>
                <Column field="supplier.companyName" header="supplier name" />
                <Column field="status" header="status" />
                <Column field="productName" header="product name"  />
                <Column field="quantity" header="quantity"  />
                <Column
                    body={(rowData) => 
                        rowData.status === 'in progress' && (
                            <Button 
                                label="Complete an order" 
                                onClick={() => handleCompleteOrder(rowData._id)} 
                                className="p-button-success"
                            />
                        )||"no action available"
                    }
                    header="action"
                />
            </DataTable>
        </div>
    );
};

export default ViewOrders;

