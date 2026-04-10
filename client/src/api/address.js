const getAuthHeader = (token) => {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getMyAddresses = async (token) => {
    const response = await fetch('/api/address', {
        headers: getAuthHeader(token)
    });
    if (!response.ok) throw new Error('Failed to fetch addresses.');
    return await response.json();
};

export const createAddress = async (addressData, token) => {
    const response = await fetch('/api/address', {
        method: 'POST',
        headers: getAuthHeader(token),
        body: JSON.stringify(addressData)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create address.');
    }
    return await response.json();
};

export const getAllAddresses = async (token) => {
    const response = await fetch('/api/address/all', {
        headers: getAuthHeader(token)
    });
    if (!response.ok) throw new Error('Failed to fetch all addresses.');
    return await response.json();
};

export const updateAddressAsAdmin = async (addressId, payload, token) => {
    const response = await fetch(`/api/address/${addressId}`, {
        method: 'PATCH',
        headers: getAuthHeader(token),
        body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update address.');
    return data;
};

export const deleteAddressAsAdmin = async (addressId, token) => {
    const response = await fetch(`/api/address/${addressId}`, {
        method: 'DELETE',
        headers: getAuthHeader(token)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete address.');
    return data;
};