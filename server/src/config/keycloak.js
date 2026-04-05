const session = require('express-session');
const Keycloak = require('keycloak-connect');
const User = require('../models/user');
const { redisStore, redisClient } = require('./redis');

const keycloakConfig = require('./keycloak.json');

const keycloak = new Keycloak({ store: redisStore }, keycloakConfig);

// Middleware to add a user in the local database if they don't exist
const loginUser = async (req, res, next) => {
    // This middleware should run after the Keycloak authentication middleware
    if (!req.kauth || !req.kauth.grant) {
        return next();
    }

    try {
        const token = req.kauth.grant.access_token;
        const keycloakUser = token.content;

        const cacheKey = `user:${keycloakUser.email}`;
        const cachedUser = await redisClient.get(cacheKey);
        if (cachedUser) {
            req.user = JSON.parse(cachedUser);
            return next();
        }

        let user = await User.findByEmail(keycloakUser.email);

        if (!user) {
            // User does not exist, create them
            const newUser = {
                email: keycloakUser.email,
                firstName: keycloakUser.given_name,
                lastName: keycloakUser.family_name,
                keycloakId: keycloakUser.sub,
                role: 'client'
            };
            const createdUser = await User.create(newUser);
            user = await User.Model.findByPk(createdUser.id);

        } else if (!user.keycloakId) {
            user.keycloakId = keycloakUser.sub;
            await user.save();
        }

        req.user = {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            companyName: user.companyName
        };

        await redisClient.set(cacheKey, JSON.stringify(req.user), { EX: 3600 }); // Cache for 1 hour

        next();
    } catch (error) {
        console.error("Error in user provisioning:", error);
        return res.status(500).json({ message: "Error processing user information." });
    }
};

module.exports = {
    keycloak,
    session,
    loginUser
};