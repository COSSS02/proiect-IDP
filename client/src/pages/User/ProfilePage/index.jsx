import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useAuth } from '../../../contexts/AuthContext';
import { getMyAddresses, createAddress } from '../../../api/address';
import { getMyOrders } from '../../../api/orders';
import { upgradeToProvider } from '../../../api/auth';
import OrderHistory from '../../../components/orderhistory/OrderHistory';
import { useToast } from '../../../contexts/ToastContext';
import './style.css';

function ProfilePage() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('profile');
    const { user } = useAuth();

    if (!user) return <div>Loading...</div>;

    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileInfo />;
            case 'addresses':
                return <Addresses />;
            case 'orders':
                return <OrderHistoryTab />;
            default:
                return <ProfileInfo />;
        }
    };

    return (
        <div className="profile-page-layout">
            <aside className="profile-tabs">
                <button onClick={() => setActiveTab('profile')} className={activeTab === 'profile' ? 'active' : ''}>{t('my_profile')}</button>
                <button onClick={() => setActiveTab('addresses')} className={activeTab === 'addresses' ? 'active' : ''}>{t('my_addresses')}</button>
                <button onClick={() => setActiveTab('orders')} className={activeTab === 'orders' ? 'active' : ''}>{t('order_history')}</button>
            </aside>
            <main className="profile-content">
                {renderContent()}
            </main>
        </div>
    );
}

// --- Sub-components for each tab ---

const ProfileInfo = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { addToast } = useToast();
    const [showUpgradeForm, setShowUpgradeForm] = useState(false);
    const [providerAddress, setProviderAddress] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        if (user.role === 'provider') {
            const fetchProviderAddress = async () => {
                try {
                    const allAddresses = await getMyAddresses(token);
                    const pAddress = allAddresses.find(addr => addr.addressType === 'provider');
                    setProviderAddress(pAddress);
                } catch (error) {
                    console.error("Failed to fetch provider address:", error);
                }
            };
            fetchProviderAddress();
        }
    }, [user.role, token]);

    const handleUpgradeSuccess = () => {
        setShowUpgradeForm(false);
        addToast("Account upgraded! Please log out and log back in to access provider features.", "success");
        // We don't automatically update the role here; a re-login is required for a new token.
    };

    return (
        <div>
            <h2 className="profile-heading">{t('my_profile')} <span className="user-role">{t(user.role)}</span></h2>
            <p><strong>{t('name')}:</strong> {user.firstName} {user.lastName}</p>
            <p><strong>{t('email')}:</strong> {user.email}</p>
            {user.role === 'provider' && (
                <>
                    <p><strong>{t('company')}:</strong> {user.companyName || 'N/A'}</p>
                    {providerAddress && (
                        <div className="provider-address-display">
                            <strong>{t('business_address')}:</strong>
                            <p>
                                {providerAddress.street}, {providerAddress.city}, {providerAddress.state} {providerAddress.zipCode}, {providerAddress.country}
                            </p>
                        </div>
                    )}
                </>
            )}

            {user.role === 'client' && (
                <div className="upgrade-section">
                    <hr style={{ margin: '2rem 0', borderColor: '#555' }} />
                    <h3>{t('become_provider')}</h3>
                    <p>{t('provider_benefits')}</p>
                    <button onClick={() => setShowUpgradeForm(!showUpgradeForm)}>
                        {showUpgradeForm ? t('cancel_upgrade') : t('upgrade_to_provider')}
                    </button>
                    {showUpgradeForm && <UpgradeForm onSuccess={handleUpgradeSuccess} />}
                </div>
            )}
        </div>
    );
};

const Addresses = () => {
    const { t } = useTranslation();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const { token } = useAuth();

    const fetchAddresses = async () => {
        setLoading(true);
        try {
            const data = await getMyAddresses(token);
            // Filter out the provider address so it doesn't show in this list
            const customerAddresses = data.filter(addr => addr.addressType !== 'provider');
            setAddresses(customerAddresses);
        } catch (error) {
            console.error("Failed to fetch addresses:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, [token]);

    const handleAddressAdded = () => {
        setShowForm(false);
        fetchAddresses(); // Refresh the list
    };

    if (loading) return <p>Loading addresses...</p>;

    return (
        <div>
            <h2>{t('my_addresses')}</h2>
            <div className="address-list">
                {addresses.length > 0 ? (
                    addresses.map(addr => (
                        <div key={addr.id} className="address-card">
                            <strong>{t(addr.addressType)}</strong>
                            <p>{addr.street}, {addr.city}, {addr.state} {addr.zipCode}, {addr.country}</p>
                        </div>
                    ))
                ) : (
                    <p>{t('no_addresses_found')}</p>
                )}
            </div>
            <button onClick={() => setShowForm(!showForm)} className='add-address-button'>
                {showForm ? t('cancel') : t('add_new_address')}
            </button>
            {showForm && <AddressForm onSuccess={handleAddressAdded} />}
        </div>
    );
};

const OrderHistoryTab = () => {
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }
        getMyOrders(token)
            .then(setOrders)
            .catch(err => {
                console.error("Failed to fetch order history:", err);
            })
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <p>Loading orders...</p>;

    return (
        <div>
            <h2>{t('order_history')}</h2>
            {orders.length > 0 ? <OrderHistory orders={orders} /> : <p>{t('no_orders_found')}</p>}
        </div>
    );
};

const AddressForm = ({ onSuccess, addressTypeFixed = null }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        addressType: addressTypeFixed || 'shipping',
        street: '', city: '', state: '', zipCode: '', country: ''
    });
    const { token } = useAuth();
    const { addToast } = useToast();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await createAddress(formData, token);
            addToast("Address added successfully!", "success");
            if (onSuccess) onSuccess();
        } catch (err) {
            addToast(`Failed to add address: ${err.message}`, "error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="profile-form" style={{ marginTop: '1.5rem', borderTop: '1px solid #555', paddingTop: '1.5rem' }}>
            {!addressTypeFixed && (
                <div className="form-group">
                    <label htmlFor="addressType">{t('addressType')}</label>
                    <select name="addressType" value={formData.addressType} onChange={handleChange}>
                        <option value="shipping">{t('shipping')}</option>
                        <option value="billing">{t('billing')}</option>
                    </select>
                </div>
            )}
            <div className="form-group"><label>{t('street')}</label><input type="text" name="street" onChange={handleChange} required /></div>
            <div className="form-group"><label>{t('city')}</label><input type="text" name="city" onChange={handleChange} required /></div>
            <div className="form-group"><label>{t('state')}</label><input type="text" name="state" onChange={handleChange} required /></div>
            <div className="form-group"><label>{t('zipCode')}</label><input type="text" name="zipCode" onChange={handleChange} required /></div>
            <div className="form-group"><label>{t('country')}</label><input type="text" name="country" onChange={handleChange} required /></div>
            <button type="submit">{t('save_address')}</button>
        </form>
    );
};

const UpgradeForm = ({ onSuccess }) => {
    const { t } = useTranslation();
    const [companyName, setCompanyName] = useState('');
    const [address, setAddress] = useState({ street: '', city: '', state: '', zipCode: '', country: '' });
    const { token } = useAuth();
    const { addToast } = useToast();

    const handleAddressChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await upgradeToProvider({ companyName, address }, token);
            if (onSuccess) onSuccess();
        } catch (err) {
            addToast(`Upgrade failed: ${err.message}`, "error");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="profile-form" style={{ marginTop: '1.5rem', borderTop: '1px solid #555', paddingTop: '1.5rem' }}>
            <div className="form-group">
                <label htmlFor="companyName">{t('company')}</label>
                <input type="text" id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />
            </div>
            <h4>{t('business_address')}</h4>
            <div className="form-group"><label>{t('street')}</label><input type="text" name="street" onChange={handleAddressChange} required /></div>
            <div className="form-group"><label>{t('city')}</label><input type="text" name="city" onChange={handleAddressChange} required /></div>
            <div className="form-group"><label>{t('state')}</label><input type="text" name="state" onChange={handleAddressChange} required /></div>
            <div className="form-group"><label>{t('zipCode')}</label><input type="text" name="zipCode" onChange={handleAddressChange} required /></div>
            <div className="form-group"><label>{t('country')}</label><input type="text" name="country" onChange={handleAddressChange} required /></div>
            <button type="submit">{t('submit_upgrade')}</button>
        </form>
    );
};

export default ProfilePage;