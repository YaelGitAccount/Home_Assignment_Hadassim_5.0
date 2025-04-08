const Supplier = require("../models/Supplier");  
const Administrator = process.env.administrator; 
const AdministratorPhone = process.env.AdministratorPhone;  

const checkUserType = async (req, res) => {
    const { phoneNumber, companyName } = req.body;  

    if (!phoneNumber || !companyName) {
        return res.status(400).json({ message: 'Phone number and company name are required' });
    }

    try {
        if (phoneNumber === AdministratorPhone && companyName === Administrator) {
           return res.json({ userType: 'administrator', _id: Administrator });  // בעל המכולת
        }

        const supplier = await Supplier.findOne({ companyName }).lean();

        if (!supplier) {
            return res.send('Incorrect username or password');  
        }
        if(phoneNumber!== supplier.phoneNumber){
            return res.send('Incorrect username or password');
        }
        return res.json({ userType: 'supplier', _id: supplier._id });
    } catch (error) {
        console.error('Error checking user type:', error);
        return res.status(500).send('error');  
    }
};

module.exports = { checkUserType };