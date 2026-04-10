const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
    }
    return data;
};

export const getMyOrders = async (token) => {
    const response = await fetch('/api/orders/', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const getProviderOrderItems = async (token) => {
    const response = await fetch('/api/orders/provider', {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const updateOrderItemStatus = async (itemId, status, token) => {
    const response = await fetch(`/api/orders/items/${itemId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
    });
    return handleResponse(response);
};

export const getAllOrders = async (page, sort, searchTerm, token) => {
    const url = `/api/orders/all?page=${page}&sort=${sort}&q=${encodeURIComponent(searchTerm)}`;
    const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};

export const deleteOrder = async (orderId, token) => {
    const url = `/api/orders/${orderId}`;
    const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return handleResponse(response);
};