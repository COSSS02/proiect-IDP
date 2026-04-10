const handleResponse = async (response) => {
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.message || 'An error occurred');
    }
    return data;
};

export const createCheckoutSession = async (token, addressIds) => {
    const response = await fetch('/api/checkout/create-checkout-session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(addressIds)
    });
    return handleResponse(response);
};

export const fulfillOrder = async (sessionId, token) => {
    const response = await fetch('/api/checkout/fulfill-order', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ sessionId })
    });
    return handleResponse(response);
};