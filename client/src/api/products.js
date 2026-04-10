export const getAllProducts = async (page = 1, sort = 'name-asc', searchTerm = '') => {
    try {
        const response = await fetch(`/api/products?page=${page}&sort=${sort}&q=${encodeURIComponent(searchTerm)}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch products:", error);
        throw error;
    }
};

export const getProductById = async (productId) => {
    try {
        const response = await fetch(`/api/products/${productId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch product with ID ${productId}:`, error);
        throw error;
    }
}

export const getProductsByCategory = async (categoryName, page = 1, sort = 'name-asc', filters={}) => {
    try {
        const params = new URLSearchParams({
            page,
            sort,
            ...filters
        });
        const response = await fetch(`/api/products/category/${encodeURIComponent(categoryName)}?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to fetch products for category "${categoryName}":`, error);
        throw error;
    }
};

export const getProviderProducts = async (token, page = 1, sort = 'name-asc') => {
    try {
        const response = await fetch(`/api/products/my-products?page=${page}&sort=${sort}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch provider products:", error);
        throw error;
    }
};

export const searchProducts = async (query, page = 1, sort = 'name-asc') => {
    try {
        const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}&page=${page}&sort=${sort}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error(`Failed to search for products with query "${query}":`, error);
        throw error;
    }
};

export const createProduct = async (productPayload, token) => {
    try {
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productPayload)
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to create product.');
        }
        return data;
    } catch (error) {
        console.error("Failed to create product:", error);
        throw error;
    }
};

export const updateProduct = async (productId, productPayload, token) => {
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(productPayload)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to update product.');
        }
        return data;
    } catch (error) {
        console.error("Failed to update product:", error);
        throw error;
    }
};

export const deleteProduct = async (productId, token) => {
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.message || 'Failed to delete product.');
        }
        return data;
    } catch (error) {
        console.error("Failed to delete product:", error);
        throw error;
    }
};