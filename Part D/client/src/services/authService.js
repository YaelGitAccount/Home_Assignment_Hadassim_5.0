import axios from 'axios';

// login
export const loginUser = async (phoneNumber, companyName) => {
    try {
        const response = await axios.post('/api/login', { phoneNumber, companyName });
        return response.data;  //  USER_TYPE   (administrator / supplier / not found)
    } catch (error) {
        console.error('Login failed', error);
        return 'error';
    }
};

// register
export const registerSupplier = async (phoneNumber, companyName) => {
    try {
        const response = await axios.post('/api/register', { phoneNumber, companyName });
        return response.data; 
    } catch (error) {
        console.error('Registration failed', error);
        return 'error';
    }
};