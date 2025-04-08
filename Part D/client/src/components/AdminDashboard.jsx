import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../styles/AdminDashboard.css';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { adminId } = useParams();
    const [suppliers, setSuppliers] = useState([]);
    const [showOrderOptions, setShowOrderOptions] = useState(false);  // Show order options after clicking "Place Order"
    const [showPlaceOrderButton, setShowPlaceOrderButton] = useState(true);  // State for "Place Order" button visibility

    // Handle "View Suppliers" button click
    const handleViewSuppliers = async () => {
        try {
            const response = await axios.get(`http://localhost:8888/api/suppliers/allSuppliers/${adminId}`);
            setSuppliers(response.data);
            // Navigate to suppliers page with data passed through state
            navigate(`/viewSuppliers/${adminId}`, { state: { suppliers: response.data } });
        } catch (err) {
            console.error('Error fetching suppliers:', err);
        }
    };

    // Handle "Search Product" button click
    const handleSearchProduct = () => {
        navigate(`/search-product/${adminId}`);
    };

    // Handle "Place Order" button click
    const handlePlaceOrder = () => {
        setShowOrderOptions(true);  // Show order options after clicking "Place Order"
        setShowPlaceOrderButton(false);  // Hide "Place Order" button
    };

    return (
        <div className="admin-dashboard">
            <h2 style={{ textAlign: 'center' }}>Welcome, Store Owner!</h2>
            <div className="buttons-container" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                {/* "Place Order" button */}
                {showPlaceOrderButton && (
                    <Button 
                        label="Place an order" 
                        icon="pi pi-shopping-cart" 
                        className="p-button-success p-button-lg" 
                        onClick={handlePlaceOrder}  // Action on click
                    />
                )}

                {/* "View Orders" button */}
                <Button
                    label="View Orders"
                    icon="pi pi-eye"
                    onClick={() => navigate(`/manager-orders/${adminId}`)}
                    className="p-button-secondary"
                />
            </div>

            {/* Show additional options after clicking "Place Order" */}
            {showOrderOptions && (
                <div className="order-options" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                    <Button 
                        label="Search Product" 
                        icon="pi pi-search" 
                        className="p-button-primary" 
                        onClick={handleSearchProduct} 
                    />
                    <Button 
                        label="View All Suppliers" 
                        icon="pi pi-users" 
                        className="p-button-info" 
                        onClick={handleViewSuppliers}  // Action on click
                    />
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
