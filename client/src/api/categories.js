export const getAllCategories = async () => {
    try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch categories:", error);
        throw error;
    }
};

export const createCategory = async (categoryData, token) => {
    try {
        const response = await fetch('/api/categories', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(categoryData)
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Failed to create category.');
        }

        return data;
    } catch (error) {
        console.error("Failed to create category:", error);
        throw error;
    }
};