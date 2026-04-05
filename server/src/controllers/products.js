const Product = require('../models/products');
const Category = require('../models/category');
const { redisClient } = require('../config/redis');

const productController = {
    /**
     * Handles the creation of a new product.
     */
    async createProduct(req, res) {
        try {
            // Get the provider's ID from the authenticated user's token.
            const providerId = req.user.id;

            const { productData, attributesData } = req.body;

            if (!productData || !attributesData) {
                return res.status(400).json({ message: "Missing productData or attributesData in request body." });
            }

            // Basic validation
            if (!productData.name || !productData.price || !productData.stockQuantity || !productData.categoryId) {
                return res.status(400).json({ message: "Missing required fields: name, price, stock, and category." });
            }
            // Discount validation
            if (productData.discountPrice && Number(productData.discountPrice) >= Number(productData.price)) {
                return res.status(400).json({ message: "Discount price must be less than original price." });
            }

            if (productData.discountPrice && (!productData.discountStartDate || !productData.discountEndDate)) {
                return res.status(400).json({ message: "Discount start and end date must be provided when setting a discount price." });
            }

            if ((productData.discountStartDate && !productData.discountEndDate) ||
                (!productData.discountStartDate && productData.discountEndDate)) {
                return res.status(400).json({ message: "Both discount start and end date must be provided." });
            }

            if (productData.discountStartDate && productData.discountEndDate) {
                if (!productData.discountPrice) {
                    return res.status(400).json({ message: "Discount price must be provided when setting discount dates." });
                }

                const start = new Date(productData.discountStartDate.replace(' ', 'T'));
                const end = new Date(productData.discountEndDate.replace(' ', 'T'));
                if (isNaN(start) || isNaN(end) || start >= end) {
                    return res.status(400).json({ message: "Invalid discount date range." });
                }
            }

            // Overwrite any providerId in the body with the one from the token.
            productData.providerId = providerId;

            const cacheKey = `attributes:category:${productData.categoryId}`;
            await redisClient.del(cacheKey);

            const productId = await Product.create(productData, attributesData);
            res.status(201).json({ message: "Product created successfully", productId });

        } catch (error) {
            res.status(500).json({ message: "Error creating product", error: error.message });
        }
    },

    /**
     * Handles updating an existing product.
     */
    async updateProduct(req, res) {
        try {
            const { id } = req.params;
            const user = req.user;
            const { productData, attributesData } = req.body;

            const cacheKey = `product:${id}`;
            await redisClient.del(cacheKey);

            if (!productData || !attributesData) {
                return res.status(400).json({ message: "Missing productData or attributesData." });
            }

            // Basic validation
            if (!productData.name || !productData.price || !productData.stockQuantity || !productData.categoryId) {
                return res.status(400).json({ message: "Missing required fields: name, price, stock, and category." });
            }
            // Discount validation
            if (productData.discountPrice && Number(productData.discountPrice) >= Number(productData.price)) {
                return res.status(400).json({ message: "Discount price must be less than original price." });
            }

            if (productData.discountPrice && (!productData.discountStartDate || !productData.discountEndDate)) {
                return res.status(400).json({ message: "Discount start and end date must be provided when setting a discount price." });
            }

            if ((productData.discountStartDate && !productData.discountEndDate) ||
                (!productData.discountStartDate && productData.discountEndDate)) {
                return res.status(400).json({ message: "Both discount start and end date must be provided." });
            }

            if (productData.discountStartDate && productData.discountEndDate) {
                if (!productData.discountPrice) {
                    return res.status(400).json({ message: "Discount price must be provided when setting discount dates." });
                }

                const start = new Date(productData.discountStartDate.replace(' ', 'T'));
                const end = new Date(productData.discountEndDate.replace(' ', 'T'));
                if (isNaN(start) || isNaN(end) || start >= end) {
                    return res.status(400).json({ message: "Invalid discount date range." });
                }
            }

            await Product.update(Number(id), user, productData, attributesData);
            res.status(200).json({ message: "Product updated successfully", productId: id });

        } catch (error) {
            // Handle specific errors from the model
            if (error.message.includes("authorized")) {
                return res.status(403).json({ message: error.message });
            }
            if (error.message.includes("not found")) {
                return res.status(404).json({ message: error.message });
            }
            res.status(500).json({ message: "Error updating product", error: error.message });
        }
    },

    /**
     * (Admin) Handles deleting a product.
     */
    async deleteProduct(req, res) {
        try {
            const { id } = req.params;

            const cacheKey = `product:${id}`;
            await redisClient.del(cacheKey);

            // Ensure the product exists and get owner
            const product = await Product.findById(Number(id));
            if (!product) {
                return res.status(404).json({ message: "Product not found." });
            }

            // Only admin or the product's provider can delete
            const isAdmin = req.user.role === 'admin';
            const isOwner = product.providerId === req.user.id;
            if (!isAdmin && !isOwner) {
                return res.status(403).json({ message: "You are not authorized to delete this product." });
            }

            await Product.delete(Number(id));
            res.status(200).json({ message: "Product deleted successfully." });
        } catch (error) {
            res.status(500).json({ message: "Error deleting product", error: error.message });
        }
    },

    /**
     * Handles retrieving a single product by its ID.
     */
    async getProductById(req, res) {
        try {
            const { id } = req.params;

            const cacheKey = `product:${id}`;
            const cachedProduct = await redisClient.get(cacheKey);
            if (cachedProduct) {
                console.log('Serving product from cache');
                return res.status(200).json(JSON.parse(cachedProduct));
            }

            const product = await Product.findById(id);

            await redisClient.set(cacheKey, JSON.stringify(product));

            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }

            console.log('Serving product from database');
            res.status(200).json(product);

        } catch (error) {
            res.status(500).json({ message: "Error retrieving product", error: error.message });
        }
    },

    /**
     * Handles searching for products.
     */
    async searchProducts(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ message: "Search query 'q' is required." });
            }

            const limit = parseInt(req.query.limit, 10) || 12;
            const page = parseInt(req.query.page, 10) || 1;
            const offset = (page - 1) * limit;

            const sort = req.query.sort || 'name-asc';
            const [sortBy, sortOrder] = sort.split('-');

            const { rows: products, count: totalProducts } = await Product.search(q, limit, offset, sortBy, sortOrder);

            res.status(200).json({
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts,
                    limit
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Error searching for products", error: error.message });
        }
    },

    /**
     * Handles retrieving all products for a given category.
     */
    async getProductsByCategory(req, res) {
        try {
            const { categoryName } = req.params;
            const limit = parseInt(req.query.limit, 10) || 12;
            const page = parseInt(req.query.page, 10) || 1;
            const offset = (page - 1) * limit;

            const sort = req.query.sort || 'name-asc';
            const [sortBy, sortOrder] = sort.split('-');

            const filters = { ...req.query };
            delete filters.limit;
            delete filters.page;
            delete filters.sort;

            // 1. Find the category details (including description)
            const category = await Category.findByName(categoryName);
            if (!category) {
                return res.status(404).json({ message: "Category not found" });
            }

            // 2. Find all products in that category with pagination
            const { rows: products, count: totalProducts } = await Product.findByCategoryName(categoryName, limit, offset, sortBy, sortOrder, filters);

            // 3. Send both back to the client with pagination info
            res.status(200).json({
                category,
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts,
                    limit
                }
            });

        } catch (error) {
            res.status(500).json({ message: "Error retrieving products by category", error: error.message });
        }
    },

    /**
     * Handles retrieving all products for the logged-in provider.
     */
    async getProviderProducts(req, res) {
        try {
            const providerId = req.user.id; // Get provider ID from authenticated user
            const limit = parseInt(req.query.limit, 10) || 12;
            const page = parseInt(req.query.page, 10) || 1;
            const offset = (page - 1) * limit;
            const sort = req.query.sort || 'name-asc';
            const [sortBy, sortOrder] = sort.split('-');

            const { rows: products, count: totalProducts } = await Product.findByProviderId(providerId, limit, offset, sortBy, sortOrder);

            res.status(200).json({
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts,
                    limit
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Error retrieving provider products", error: error.message });
        }
    },

    async getAllProducts(req, res) {
        try {
            // Set default limit to 20, can be overridden by query param
            const limit = parseInt(req.query.limit, 10) || 12;
            // Get page from query param, default to page 1
            const page = parseInt(req.query.page, 10) || 1;
            const offset = (page - 1) * limit;

            const q = req.query.q || '';

            const sort = req.query.sort || 'name-asc'; // e.g., 'price-asc'
            const [sortBy, sortOrder] = sort.split('-');

            const { rows: products, count: totalProducts } = await Product.findAll(limit, offset, sortBy, sortOrder, q);

            res.status(200).json({
                products,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(totalProducts / limit),
                    totalProducts,
                    limit
                }
            });
        } catch (error) {
            res.status(500).json({ message: "Error retrieving products", error: error.message });
        }
    }
};

module.exports = productController;