import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Card } from 'primereact/card';
import { Message } from 'primereact/message';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';

const SupplierProducts = () => {
    const { supplierId, adminId } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [noProductsMessage, setNoProductsMessage] = useState('');
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [orderQuantity, setOrderQuantity] = useState(0);
    const [showDialog, setShowDialog] = useState(false);
    const toast = useRef(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get(`http://localhost:8888/api/suppliers/getProducstBySupplier/${supplierId}`);
                if (response.data?.message === 'No products found') {
                    setNoProductsMessage('This supplier has no products to display.');
                } else {
                    setProducts(response.data[0]?.products || []);
                }
            } catch (err) {
                console.error('Error fetching products:', err);
                setNoProductsMessage('An error occurred while loading products.');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [supplierId]);

    const openOrderDialog = (product) => {
        setSelectedProduct(product);
        setOrderQuantity(product.minQuantity);
        setShowDialog(true);
    };

    const hideDialog = () => {
        setShowDialog(false);
        setSelectedProduct(null);
        setOrderQuantity(0);
    };

    const handleOrder = async () => {
        const { productName, minQuantity } = selectedProduct;

        const confirmAndSend = async (quantityToSend) => {
            try {
                await axios.post(`http://localhost:8888/api/orders/${adminId}`, {
                    supplierId,
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
            } catch (error) {
                console.error('Error placing order:', error);
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
                reject: () => {}, // Do nothing
            });
        } else {
            confirmAndSend(orderQuantity);
        }
    };

    return (
        <div style={{ padding: '2rem' }}>
            <Toast ref={toast} />
            <ConfirmDialog />
            <h2 style={{ textAlign: 'center' }}>Supplier Products</h2>
            {loading ? (
                <div style={{ textAlign: 'center', marginTop: '3rem' }}>
                    <ProgressSpinner />
                </div>
            ) : noProductsMessage ? (
                <Message severity="info" text={noProductsMessage} style={{ textAlign: 'center', marginTop: '2rem' }} />
            ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem' }}>
                    {products.map((product, index) => (
                        <Card
                            key={index}
                            title={product.productName}
                            subTitle={`price: ${product.pricePerUnit} ₪`}
                            style={{ width: '250px', direction: 'rtl' }}
                        >
                            <p><strong>Minimum order quantity:</strong> {product.minQuantity}</p>
                            <Button
                                label="Order Product"
                                icon="pi pi-shopping-cart"
                                className="p-button-primary"
                                onClick={() => openOrderDialog(product)}
                            />
                        </Card>
                    ))}
                </div>
            )}

            <Dialog header="Order Product" visible={showDialog} onHide={hideDialog} style={{ width: '350px' }}>
                {selectedProduct && (
                    <div className="p-fluid">
                        <p>Enter quantity for <strong>{selectedProduct.productName}</strong></p>
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

export default SupplierProducts;
