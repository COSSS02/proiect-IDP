const User = require('../models/user');
const Address = require('../models/address');

const authController = {

    async getUserToken(req, res) {
        if (req.user) {
            res.status(200).json(req.user);
        } else {
            res.status(401).json({ message: "User not authenticated." });
        }
    },

    async upgradeToProvider(req, res) {
        try {
            const userId = req.user.id;
            const { companyName, address } = req.body;

            if (!companyName || !address) {
                return res.status(400).json({ message: "Company name and address are required." });
            }

            // Create the business address for the user
            await Address.create({
                userId,
                addressType: 'provider',
                ...address
            });

            // Update the user's role and company name
            await User.updateRoleAndCompany(userId, 'provider', companyName);

            // Advise user to re-login to get an updated token with the new role
            res.status(200).json({ message: "Account successfully upgraded to provider. Please log out and log back in to access provider features." });

        } catch (error) {
            res.status(500).json({ message: "Error upgrading account", error: error.message });
        }
    }
};

module.exports = authController;