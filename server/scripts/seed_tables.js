const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { sequelize } = require('../src/config/db');
const User = require('../src/models/user');
const Category = require('../src/models/category');
const Attribute = require('../src/models/attribute');
const Product = require('../src/models/products');

const CATEGORIES = ["CPU", "CPU Cooler", "GPU", "Motherboard", "PC Case", "PC Fans", "PSU", "RAM", "Storage"];
const DATA_FILES = ["cpu.csv", "cpu_cooler.csv", "gpu.csv", "motherboard.csv", "pc_case.csv", "pc_fans.csv", "psu.csv", "ram.csv", "storage.csv"];

const CATEGORY_ID_DICT = {
    "GPU": 1, "CPU": 2, "RAM": 3, "Motherboard": 4, "Storage": 5,
    "PSU": 7, "PC Case": 8, "CPU Cooler": 9, "PC Fans": 10
};

const CAPITALIZED_ATTRIBUTES = ["CAS", "GB", "PWM", "RPM", "TDP"];

const PROVIDER_EMAILS = ['forit@mail.com', 'vexio@mail.com', 'itgalaxy@mail.com', 'shop4pc@mail.com'];

function convertAttributeName(attribute) {
    return attribute.replace(/_/g, ' ').toLowerCase().split(' ')
        .map(word => CAPITALIZED_ATTRIBUTES.includes(word.toUpperCase()) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function getProviderId(index, providerIdMap) {
    if (index < 9) return providerIdMap[PROVIDER_EMAILS[0]];
    if (index < 19) return providerIdMap[PROVIDER_EMAILS[1]];
    if (index < 29) return providerIdMap[PROVIDER_EMAILS[2]];
    return providerIdMap[PROVIDER_EMAILS[3]];
}

const seedDatabase = async () => {
    try {
        // Seed Categories with specific IDs
        console.log('Seeding categories...');
        const categoryPromises = CATEGORIES.map(categoryName => {
            const categoryId = CATEGORY_ID_DICT[categoryName];
            if (categoryId) {
                return Category.Model.create({ id: categoryId, name: categoryName });
            }
            console.warn(`Warning: No ID found for category '${categoryName}' in CATEGORY_ID_DICT. Skipping.`);
            return null;
        }).filter(Boolean);

        await Promise.all(categoryPromises);
        console.log('Categories seeded successfully.');

        // Fetch provider IDs from the database
        console.log('Fetching provider user IDs...');
        const providers = await User.Model.findAll({
            where: { email: PROVIDER_EMAILS },
            attributes: ['id', 'email']
        });

        if (providers.length !== PROVIDER_EMAILS.length) {
            throw new Error('Could not find all provider users. Please run the user creation script first.');
        }

        const providerIdMap = providers.reduce((acc, provider) => {
            acc[provider.email] = provider.id;
            return acc;
        }, {});
        console.log('Provider IDs fetched successfully.');

        // Process each category and its corresponding data file
        for (let i = 0; i < CATEGORIES.length; i++) {
            const categoryName = CATEGORIES[i];
            const fileName = DATA_FILES[i];
            const filePath = path.join(__dirname, '../data', fileName);
            const categoryId = CATEGORY_ID_DICT[categoryName];
            let productIndex = 0;

            console.log(`\n--- Processing category: ${categoryName} ---`);

            const stream = fs.createReadStream(filePath).pipe(csv());

            for await (const row of stream) {
                const t = await sequelize.transaction();
                try {
                    // Insert the core product data
                    const providerId = getProviderId(productIndex, providerIdMap);
                    const productData = {
                        name: row.name,
                        description: "",
                        price: parseFloat(row.price) || 0,
                        stockQuantity: Math.floor(Math.random() * 101),
                        categoryId: categoryId,
                        providerId: providerId
                    };

                    const product = await Product.Model.create(productData, { transaction: t });

                    // Handle attributes
                    for (const attributeName in row) {
                        if (attributeName === 'name' || attributeName === 'price') continue;

                        const value = row[attributeName];
                        if (value === null || value === '' || value === 'nan') continue;

                        const formattedAttrName = convertAttributeName(attributeName);

                        // Find or create the attribute for this category
                        const [attribute] = await Attribute.Model.findOrCreate({
                            where: { name: formattedAttrName, categoryId: categoryId },
                            defaults: { name: formattedAttrName, categoryId: categoryId },
                            transaction: t
                        });

                        // Link the attribute to the product
                        await Product.AttributeModel.create({
                            productId: product.id,
                            attributeId: attribute.id,
                            value: String(value)
                        }, { transaction: t });
                    }

                    await t.commit();
                    productIndex++;

                } catch (error) {
                    await t.rollback();
                    console.error(`Error processing product '${row.name}': ${error.message}`);
                }
            }
        }
        console.log("\nDatabase seeding completed successfully!");

    } catch (error) {
        console.error('An unexpected error occurred:', error);
        process.exit(1);
    }
};

module.exports = { seedDatabase };