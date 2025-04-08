import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';  // Using useLocation to get the information from the state
import { Button } from 'primereact/button';
import '../styles/ViewSuppliers.css'; 
import { useParams } from 'react-router-dom';

const ViewSuppliers = () => {
    const adminId= useParams().adminId;
    const location = useLocation();  // Receiving information from the state
    const navigate = useNavigate();
    const { suppliers } = location.state || {};  // Obtaining information about suppliers from the state

// Navigate to the supplier details page
    const handleNavigateToSupplier = (supplierId) => {
        navigate(`/supplier-products/${supplierId}/${adminId}`);
    };

    return (
        <div className="view-suppliers">
            <h2 style={{ textAlign: 'center' }}>All suppliers</h2>
            <div className="suppliers-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
                {suppliers && suppliers.map((supplier) => (
                    <div
                        key={supplier._id}
                        className="supplier-card"
                        onClick={() => handleNavigateToSupplier(supplier._id)}  // Navigate to the supplier details page
                        style={{ cursor: 'pointer', border: '1px solid #ccc', padding: '1rem', width: '200px', textAlign: 'center', borderRadius: '8px' }}
                    >
                        <h3>{supplier.companyName}</h3>
                        <p>{supplier.city}</p>
                        <p>{supplier.phone}</p>
                        <Button label="Choose this supplier" icon="pi pi-check" className="p-button-success" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ViewSuppliers;
