import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import axios from 'axios';
import '../styles/LoginForm.css'; 
import { useNavigate } from 'react-router-dom';

const LoginForm = ({ onLogin }) => {
    const navigate = useNavigate();

    const [phoneNumber, setPhoneNumber] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [error, setError] = useState('');

    // Handles the form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8888/api/login', { phoneNumber, companyName });
            const role = response.data.userType;

            // Check if the credentials are correct
            if (role === 'Incorrect username or password') {
                setError('Incorrect username or password');
            } else {
                setError('');
                // Navigate based on the user role
                if (role === 'administrator') {
                    navigate(`/admin-dashboard/${response.data._id}`);
                } else if (role === 'supplier') {
                    navigate(`/supplier-orders/${response.data._id}`);
                }
            }
        } catch (err) {
            setError('Login error');
        }
    };

    // Check if the form is valid for submission
    const isFormValid = companyName.trim() !== '' && phoneNumber.trim() !== '';

    // Navigate to the registration page
    const handleRegisterRedirect = () => {
        navigate('/register');
    };

    return (
        <div className="login-card">
            <h2>Login</h2>
            <form onSubmit={handleSubmit} className="form">
                <InputText
                    placeholder="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="p-inputtext-lg"
                />
                <InputText
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="p-inputtext-lg"
                />
                {error && <small className="error">{error}</small>}
                <Button 
                    label="Login" 
                    type="submit" 
                    className="p-button-lg" 
                    disabled={!isFormValid} // Button disabled if fields are not filled
                />
            </form>
            <div className="register-link">
                <button 
                    onClick={handleRegisterRedirect} 
                    className="p-button-text"
                >
                    Not registered? Register here
                </button>
            </div>
        </div>
    );
};

export default LoginForm;
