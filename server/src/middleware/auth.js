const axios = require('axios');
const keycloakConfig = require('../config/keycloak.json');
require('dotenv').config();

const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        // Construct the userinfo endpoint URL
        const userInfoUrl = `${process.env.KEYCLOAK_URL}/realms/${keycloakConfig.realm}/protocol/openid-connect/userinfo`;

        const response = await axios.get(userInfoUrl, {
            headers: {
                Authorization: authHeader,
            },
        });

        // If the request is successful (status 200), the token is valid.
        req.kauth = {
            grant: {
                access_token: {
                    content: response.data
                }
            }
        };

        next();
    } catch (error) {
        // If the request throws an error, the token is invalid or expired.
        console.error('Token validation error:', error.response ? error.response.data : error.message);
        return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
};

module.exports = authMiddleware;