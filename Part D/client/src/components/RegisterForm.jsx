import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import '../styles/RegisterForm.css'; 

const RegisterForm = ({ onRegister }) => {
    const navigate = useNavigate();

    const [companyName, setCompanyName] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [representativeName, setRepresentativeName] = useState('');
    const [productName, setProductName] = useState('');
    const [pricePerUnit, setPricePerUnit] = useState('');
    const [minQuantity, setMinQuantity] = useState('');
    const [products, setProducts] = useState([]);
    const [showProducts, setShowProducts] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [editingProductIndex, setEditingProductIndex] = useState(null);
    const [editedProduct, setEditedProduct] = useState({ productName: '', pricePerUnit: '', minQuantity: '' });

    const handleAddProduct = () => {
        if (!productName || !pricePerUnit || !minQuantity) {
            setErrorMessage('All fields must be valid (price per product and minimum quantity must be positive numbers).');
            return;
        }

        if (editingProductIndex !== null) {
            const updatedProducts = [...products];
            updatedProducts[editingProductIndex] = editedProduct;
            setProducts(updatedProducts);
            setSuccessMessage('Product updated successfully!');
            setEditingProductIndex(null);
        } else {
            // Add new product
            const newProduct = { productName, pricePerUnit: parseFloat(pricePerUnit), minQuantity: parseInt(minQuantity) };
            setProducts([...products, newProduct]);
            setSuccessMessage('Product added successfully!');
        }

        // Clear product fields only
        setProductName('');
        setPricePerUnit('');
        setMinQuantity('');
        setEditedProduct({ productName: '', pricePerUnit: '', minQuantity: '' });
        
        // Show success message for 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleRegister = async () => {
        if (!companyName || !phoneNumber || !representativeName || products.length === 0) {
            setErrorMessage('All fields must be filled before registration.');
            return;
        }
    
        try {
            const supplierData = { companyName, phoneNumber, representativeName, products };
            // POST request to server
            const response = await axios.post('http://localhost:8888/api/suppliers', supplierData);
            
            if (response.status === 201) {
                // If registration is successful
                

                try {
                    const response = await axios.post('http://localhost:8888/api/login', { phoneNumber, companyName });
                    const role = response.data.userType;
                        if (role === 'administrator') {
                            navigate(`/admin-dashboard/${response.data._id}`); 
                        } else if (role === 'supplier') {
                            navigate(`/supplier-orders/${response.data._id}`);
                        }
                    
                } catch (err) {
                 
                }


                setSuccessMessage('Registration successful!');
                setTimeout(() => setSuccessMessage(''), 3000);
                onRegister(supplierData);
            } else if (response.status === 409) {
                // אם שם החברה כבר קיים
                setErrorMessage('Company name already exists');
            }
        } catch (error) {
            console.error("Registration error", error);
            if (error.response && error.response.status === 409) {
                setErrorMessage('Company name already exists');
            } else {
                setErrorMessage('There was an error registering, please try again');
            }
            setTimeout(() => setErrorMessage(''), 3000);
        }
    };

    const handleEditProduct = (index) => {
        setEditingProductIndex(index);
        setEditedProduct(products[index]);
    };

    const handleDeleteProduct = (index) => {
        const updatedProducts = products.filter((_, i) => i !== index);
        setProducts(updatedProducts);
    };

    // Navigate to login page
    const goToLogin = () => {
        navigate('/');
    };

    return (
        <div className="card p-4 max-w-md mx-auto">
            <h2 className="text-xl mb-4">Register as supplier</h2>
            
            <div className="mb-3">
                <label htmlFor="companyName" className="block">Company Name</label>
                <InputText
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full"
                />
            </div>

            <div className="mb-3">
                <label htmlFor="phoneNumber" className="block">Phone Number</label>
                <InputText
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    keyfilter="alphanum"
                    className="w-full"
                />
            </div>

            <div className="mb-3">
                <label htmlFor="representativeName" className="block">Representative Name</label>
                <InputText
                    id="representativeName"
                    value={representativeName}
                    onChange={(e) => setRepresentativeName(e.target.value)}
                    className="w-full"
                />
            </div>

            <h3 className="mt-5 mb-3">Add Products</h3>

            <div className="mb-3">
                <label htmlFor="productName" className="block">Product Name</label>
                <InputText
                    id="productName"
                    value={editingProductIndex !== null ? editedProduct.productName : productName}
                    onChange={(e) => (editingProductIndex !== null ? setEditedProduct({ ...editedProduct, productName: e.target.value }) : setProductName(e.target.value))}
                    className="w-full"
                />
            </div>

            <div className="mb-3">
                <label htmlFor="pricePerUnit" className="block">Price per Unit</label>
                <InputText
                    id="pricePerUnit"
                    value={editingProductIndex !== null ? editedProduct.pricePerUnit : pricePerUnit}
                    onChange={(e) => setPricePerUnit(e.target.value)}
                    className="w-32"
                    type="number"
                    min="0"
                />
            </div>

            <div className="mb-3">
                <label htmlFor="minQuantity" className="block">Minimum Quantity</label>
                <InputText
                    id="minQuantity"
                    value={editingProductIndex !== null ? editedProduct.minQuantity : minQuantity}
                    onChange={(e) => setMinQuantity(e.target.value)}
                    className="w-32"
                    type="number"
                    min="1"
                />
            </div>
            
            <Button label={editingProductIndex !== null ? "Update Product" : "Add Product"} onClick={handleAddProduct} className="mb-3" />

            {successMessage && <small className="text-green-600">{successMessage}</small>}
            {errorMessage && <small className="text-red-600">{errorMessage}</small>}

            <Button
                label={showProducts ? "Hide Products" : "View Products"}
                onClick={() => setShowProducts(!showProducts)}
                className="mt-3"
            />

            {showProducts && (
                <div className="mt-3">
                    <h4>Products You Added:</h4>
                    <ul>
                        {products.map((product, index) => (
                            <li key={index} className="mb-2">
                                {product.productName} - {product.pricePerUnit} ₪ - Min {product.minQuantity}
                                <Button label="Edit" icon="pi pi-pencil" onClick={() => handleEditProduct(index)} className="p-button-info ml-2" />
                                <Button label="Delete" icon="pi pi-trash" onClick={() => handleDeleteProduct(index)} className="p-button-danger ml-2" />
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <Button label="Register" onClick={handleRegister} className="mt-3" />
            {/* Button for login */}
            <Button label="Go to Login" onClick={goToLogin} className="mt-3" />
        </div>
    );
};

export default RegisterForm;
