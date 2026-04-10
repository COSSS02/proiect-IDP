export const getUserToken = async (token) => {
    const response = await fetch('/api/auth/token', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch user token.');
    }
    return await response.json();
}

export const upgradeToProvider = async (providerData, token) => {
    const response = await fetch('/api/auth/upgrade-to-provider', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(providerData)
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upgrade account.');
    }
    return await response.json();
};