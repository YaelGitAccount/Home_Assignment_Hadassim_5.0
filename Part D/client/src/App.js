import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';  
import SupplierOrders from './components/SupplierOrders';
import AdminDashboard from './components/AdminDashboard';
import ViewOrders from './components/ViewOrders';
import ViewSuppliers from './components/viewSuppliers';  
import SupplierProducts from './components/SupplierProducts';
import SearchProduct from './components/SearchProduct'; 

import './styles/styles.css';

function App() {
    const [user, setUser] = useState(null);
    const handleLogin = (role, name) => {
        setUser({ role, name });
    };

    return (
        <Router>
            <Routes>
                <Route path="/" element={<LoginForm onLogin={handleLogin} />} />
                <Route path="/register" element={<RegisterForm onRegister={handleLogin} />} /> 
                <Route path="/supplier-orders/:supplierId" element={<SupplierOrders />} />
                <Route path="/admin-dashboard/:adminId" element={<AdminDashboard />} />
                <Route path="/manager-orders/:managerId" element={<ViewOrders />} />
                <Route path="/viewSuppliers/:adminId" element={<ViewSuppliers />} /> 
                <Route path="/supplier-products/:supplierId/:adminId" element={<SupplierProducts />} />
                <Route path="/search-product/:adminId" element={<SearchProduct />} />


            </Routes>
        </Router>
    );
}

export default App;