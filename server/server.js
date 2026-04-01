const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const https = require('https');
require('dotenv').config();
const { keycloak, session } = require('./src/config/keycloak.js');
const { redisStore } = require('./src/config/redis');
const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/user');
const dashboardRoutes = require('./src/routes/dashboard');
const addressRoutes = require('./src/routes/address');
const productRoutes = require('./src/routes/products');
const categoryRoutes = require('./src/routes/category');
const attributeRoutes = require('./src/routes/attribute');
const cartRoutes = require('./src/routes/cart');
const orderRoutes = require('./src/routes/orders');
const wishlistRoutes = require('./src/routes/wishlist');
const checkoutRoutes = require('./src/routes/checkout');

const { testDbConnection } = require('./src/config/db');
const { checkUsersTable } = require('./scripts/create_tables');

const initializeDatabase = async () => {
    try {
        await testDbConnection();

        await checkUsersTable();

    } catch (error) {
        console.error('An error occurred during database initialization:', error);
        process.exit(1);
    }
};

initializeDatabase();

const app = express();
const port = 3000;

app.use(express.json());

// Session for Keycloak
app.use(session({
    secret: process.env.KEYCLOAK_SECRET,
    resave: false,
    saveUninitialized: true,
    store: redisStore
}));

app.use(keycloak.middleware());

app.get('/health', (req, res) => {
    const containerId = os.hostname();
    console.log(`Health check handled by container: ${containerId}`);
    res.status(200).send(`OK from container: ${containerId}`);
});

app.use(express.static(path.join(__dirname, 'client/dist')));
app.use('/images', express.static(path.join(__dirname, 'images')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/attributes', attributeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/checkout', checkoutRoutes);

app.get("/*splat", (req, res) => {
    res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

const options = {
    key: fs.readFileSync(path.join(__dirname, './certs/key.pem')),
    cert: fs.readFileSync(path.join(__dirname, './certs/cert.pem'))
};

https.createServer(options, app).listen(port, () => {
    console.log(`HTTPS server running on https://localhost:${port}`);
});