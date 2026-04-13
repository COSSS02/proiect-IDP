const User = require('../src/models/user');
const Address = require('../src/models/address');

const createAddresses = async () => {
    try {
        console.log('Creating addresses for users...');

        // Find the users created in the previous script
        const providers = await User.Model.findAll({ where: { role: 'provider' } });
        const client = await User.Model.findOne({ where: { email: 'johndoe@mail.com' } });

        if (providers.length === 0 || !client) {
            console.error('Could not find users to create addresses for. Make sure create_users script ran first.');
            return;
        }

        const addressesToCreate = [];

        // Create addresses for providers
        providers.forEach((provider, index) => {
            addressesToCreate.push({
                userId: provider.id,
                addressType: 'provider',
                street: `10${index} Provider Lane`,
                city: 'Techville',
                state: 'Silicon State',
                zipCode: `9000${index}`,
                country: 'Innovatia'
            });
        });

        // Create address for the client
        addressesToCreate.push({
            userId: client.id,
            addressType: 'shipping',
            street: '123 Client Street',
            city: 'Userburg',
            state: 'State of User',
            zipCode: '12345',
            country: 'Appland'
        });

        await Address.Model.bulkCreate(addressesToCreate, { ignoreDuplicates: true });

        console.log(`${addressesToCreate.length} addresses created successfully.`);

    } catch (error) {
        console.error('Unable to create addresses:', error);
        process.exit(1);
    }
};

module.exports = { createAddresses };