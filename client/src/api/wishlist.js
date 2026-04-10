const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
    }
    return data;
};

export const getWishlist = async (token) => {
    const response = await fetch('/api/wishlist', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const addToWishlist = async (productId, token) => {
    const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
    });
    return handleResponse(response);
};

export const removeFromWishlist = async (productId, token) => {
    const response = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};