const User = require('../src/models/user');

const providers = [
    {
        email: 'forit@mail.com',
        firstName: 'For',
        lastName: 'IT',
        companyName: 'ForIT',
        role: 'provider'
    },
    {
        email: 'vexio@mail.com',
        firstName: 'Ve',
        lastName: 'Xio',
        companyName: 'Vexio',
        role: 'provider'
    },
    {
        email: 'itgalaxy@mail.com',
        firstName: 'IT',
        lastName: 'Galaxy',
        companyName: 'ITGalaxy',
        role: 'provider'
    },
    {
        email: 'shop4pc@mail.com',
        firstName: 'Shop',
        lastName: '4PC',
        companyName: 'Shop4PC',
        role: 'provider'
    }
];

const clients = [
    {
        email: 'johndoe@mail.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'client'
    }
];

const admins = [
    {
        email: 'ionescucosmin2003@gmail.com',
        firstName: 'Ionescu',
        lastName: 'Mihai-Cosmin',
        role: 'admin'
    }
];

const createProviders = async () => {
    try {
        console.log('Creating provider users...');

        await User.Model.bulkCreate(providers, { ignoreDuplicates: true });

        console.log(`${providers.length} provider users created.`);

        console.log('Creating client users...');

        await User.Model.bulkCreate(clients, { ignoreDuplicates: true });

        console.log(`${clients.length} client users created.`);

        console.log('Creating admin users...');

        await User.Model.bulkCreate(admins, { ignoreDuplicates: true });

        console.log(`${admins.length} admin users created.`);
    } catch (error) {
        console.error('Unable to perform database operation:', error);
        process.exit(1);
    }
};

module.exports = { createProviders };