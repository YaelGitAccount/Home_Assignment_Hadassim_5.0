import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import '../styles/SearchProduct.css';

const SearchProduct = () => {
    const { adminId } = useParams();
    const [productName, setProductName] = useState('');
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [orderQuantity, setOrderQuantity] = useState(0);
    const [showDialog, setShowDialog] = useState(false);
    const toast = useRef(null);

    const handleProductNameChange = (e) => {
        setProductName(e.target.value);
    };

    const handleSearchProduct = async () => {
        if (!productName) {
            setError('Product name is required!');
            return;
        }

        setLoading(true);
        setError('');
        setSuppliers([]);

        try {
            const response = await axios.get(`http://localhost:8888/api/suppliers/${productName}`);
            if (response.data.length === 0) {
                setError('No suppliers found for this product');
            } else {
                setSuppliers(response.data);
            }
        } catch (err) {
            setError('Server error, please try again later');
        } finally {
            setLoading(false);
        }
    };

    const openOrderDialog = (supplier) => {
        setSelectedSupplier(supplier);
        setOrderQuantity(supplier.products.minQuantity);
        setShowDialog(true);
    };

    const hideDialog = () => {
        setShowDialog(false);
        setSelectedSupplier(null);
        setOrderQuantity(0);
    };

    const handleOrder = async () => {
        const { productName, minQuantity, pricePerUnit } = selectedSupplier.products;

        const confirmAndSend = async (quantityToSend) => {
            try {
                await axios.post(`http://localhost:8888/api/orders/${adminId}`, {
                   supplierId: selectedSupplier._id,
                productName,
                    quantity: quantityToSend
                });

                toast.current.show({
                    severity: 'success',
                    summary: 'Success',
                    detail: `Order of ${quantityToSend} units was placed successfully.`,
                    life: 3000
                });
                hideDialog();
            } catch (err) {
                console.error(err);
                toast.current.show({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Failed to place order. Please try again.',
                    life: 3000
                });
            }
        };

        if (orderQuantity < minQuantity) {
            confirmDialog({
                message: `Minimum order is ${minQuantity} units. Do you want to place an order for the minimum quantity?`,
                header: 'Minimum Quantity Required',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Yes',
                rejectLabel: 'No',
                accept: () => confirmAndSend(minQuantity),
                reject: () => {},
            });
        } else {
            confirmAndSend(orderQuantity);
        }
    };

    return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Toast ref={toast} />
            <ConfirmDialog />
            <h2>Product Search</h2>
            <div style={{ marginBottom: '1rem' }}>
                <InputText
                    value={productName}
                    onChange={handleProductNameChange}
                    placeholder="Enter product name"
                    className="p-inputtext-lg"
                />
            </div>
            <Button
                label="Search Product"
                icon="pi pi-search"
                className="p-button-primary p-button-lg"
                onClick={handleSearchProduct}
                disabled={loading || !productName}
            />
            {error && <div style={{ color: 'red', marginTop: '1rem' }}>{error}</div>}
            {loading && <div>Searching...</div>}

            {suppliers.length > 0 && (
                <div className="suppliers-container" style={{ marginTop: '2rem' }}>
                    {suppliers.map((supplier) => (
                        <div
                            key={supplier._id}
                            className="supplier-card"
                            style={{
                                border: '1px solid #ccc',
                                padding: '1rem',
                                margin: '1rem',
                                borderRadius: '8px'
                            }}
                        >
                            <h3>{supplier.companyName}</h3>
                            <p>Product: {supplier.products.productName}</p>
                            <p>Price per unit: {supplier.products.pricePerUnit} ₪</p>
                            <p>Minimum quantity: {supplier.products.minQuantity}</p>
                            <Button
                                label="Order"
                                icon="pi pi-shopping-cart"
                                className="p-button-success"
                                onClick={() => openOrderDialog(supplier)}
                            />
                        </div>
                    ))}
                </div>
            )}

            <Dialog header="Order Product" visible={showDialog} onHide={hideDialog} style={{ width: '350px' }}>
                {selectedSupplier && (
                    <div className="p-fluid">
                        <p>Enter quantity for <strong>{selectedSupplier.products.productName}</strong></p>
                        <InputNumber
                            value={orderQuantity}
                            onValueChange={(e) => setOrderQuantity(e.value)}
                            showButtons
                            buttonLayout="horizontal"
                            step={1}
                            decrementButtonClassName="p-button-secondary"
                            incrementButtonClassName="p-button-secondary"
                        />
                        <div style={{ marginTop: '1rem', textAlign: 'left' }}>
                            <Button
                                label="Place Order"
                                icon="pi pi-check"
                                className="p-button-success"
                                onClick={handleOrder}
                            />
                        </div>
                    </div>
                )}
            </Dialog>
        </div>
    );
};

export default SearchProduct;
