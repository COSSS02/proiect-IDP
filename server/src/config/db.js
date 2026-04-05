const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_DATABASE,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST || 'mariadb',
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    });

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const testDbConnection = async () => {
    const maxRetries = 10;
    const retryDelay = 5000;

    for (let i = 1; i <= maxRetries; i++) {
        try {
            await sequelize.authenticate();
            console.log('Database connection has been established successfully.');
            return;
        } catch (error) {
            console.error(`Unable to connect to the database (attempt ${i}/${maxRetries}):`, error.name);
            if (i === maxRetries) {
                console.error('Max retries reached. Exiting.');
                throw error;
            }
            console.log(`Retrying in ${retryDelay / 1000} seconds...`);
            await wait(retryDelay);
        }
    }
};

module.exports = { sequelize, testDbConnection };