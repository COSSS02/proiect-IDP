const { sequelize } = require('../src/config/db');

const { createProviders } = require('./create_users');

const { createAddresses } = require('./create_addresses');

const { seedDatabase } = require('./seed_tables');

const checkUsersTable = async () => {
    try {
        const queryInterface = sequelize.getQueryInterface();
        const tables = await queryInterface.showAllTables();
        if (tables.includes('users')) {
            console.log('Table "users" exists. Database seeding not required.');
        } else {
            console.log('Table "users" does not exist. Creating tables and seeding database...');
            await sequelize.sync({ force: true });

            await createProviders();

            await createAddresses();

            await seedDatabase();
        }
    } catch (error) {
        console.error('An error occurred while checking for the users table:', error);
    }
};

module.exports = { checkUsersTable };