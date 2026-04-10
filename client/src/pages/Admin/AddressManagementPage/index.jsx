import React, { useEffect, useState } from 'react';
import { useTranslation } from "react-i18next";
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { getAllAddresses, updateAddressAsAdmin, deleteAddressAsAdmin } from '../../../api/address';
import './style.css';

function AdminAddressManagementPage() {
    const { t } = useTranslation();
    const { token } = useAuth();
    const { addToast } = useToast();
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [filterRole, setFilterRole] = useState('all');
    const [filterType, setFilterType] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');

    const load = async () => {
        try {
            setLoading(true);
            const data = await getAllAddresses(token);
            setAddresses(data);
        } catch (e) {
            addToast(e.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [token]);

    // Debouncing effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(inputValue);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [inputValue]);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this address?')) return;
        try {
            await deleteAddressAsAdmin(id, token);
            addToast('Address deleted', 'success');
            load();
        } catch (e) {
            addToast(e.message, 'error');
        }
    };

    const handleUpdate = async (formData) => {
        try {
            await updateAddressAsAdmin(editing.id, formData, token);
            addToast('Address updated', 'success');
            setEditing(null);
            load();
        } catch (e) {
            addToast(e.message, 'error');
        }
    };

    const filtered = addresses.filter(a => {
        const roleOk = filterRole === 'all' || a.user.role === filterRole;
        const typeOk = filterType === 'all' || a.addressType === filterType;
        const term = searchTerm.trim().toLowerCase();
        const match = !term || [a.street, a.city, a.user.email, a.user.firstName, a.user.lastName].some(v => (v || '').toLowerCase().includes(term));
        return typeOk && roleOk && match;
    });

    if (loading) return <div className="admin-address-container"><p>Loading addresses...</p></div>;

    return (
        <div className="admin-address-container">
            <h1>{t('address_management')}</h1>

            <div className="toolbar">
                <input
                    type="text"
                    placeholder={t('ph_address_management')}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                />
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                    <option value="all">{t('all_roles')}</option>
                    <option value="client">{t('client')}</option>
                    <option value="provider">{t('provider')}</option>
                    <option value="admin">{t('admin')}</option>
                </select>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}>
                    <option value="all">{t('all_types')}</option>
                    <option value="shipping">{t('shipping')}</option>
                    <option value="billing">{t('billing')}</option>
                    <option value="provider">{t('provider')}</option>
                </select>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>{t('user')}</th>
                            <th>{t('email')}</th>
                            <th>{t('role')}</th>
                            <th>{t('type')}</th>
                            <th>{t('street')}</th>
                            <th>{t('city')}</th>
                            <th>{t('state')}</th>
                            <th>{t('zipCode')}</th>
                            <th>{t('country')}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(addr => (
                            <tr key={addr.id}>
                                <td>{addr.id}</td>
                                <td>{addr.user.firstName} {addr.user.lastName}</td>
                                <td>{addr.user.email}</td>
                                <td><span className={`role-badge role-${addr.user.role}`}>{addr.user.role}</span></td>
                                <td>{t(addr.addressType)}</td>
                                <td>{addr.street}</td>
                                <td>{addr.city}</td>
                                <td>{addr.state}</td>
                                <td>{addr.zipCode}</td>
                                <td>{addr.country}</td>
                                <td className="actions-cell">
                                    <button className="action-btn edit-btn" onClick={() => setEditing(addr)}>{t('edit')}</button>
                                    <button className="action-btn delete-btn" onClick={() => handleDelete(addr.id)}>{t('delete')}</button>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan="11" style={{ textAlign: 'center', padding: '1rem' }}>No addresses match filters.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editing && (
                <EditAddressModal
                    address={editing}
                    onClose={() => setEditing(null)}
                    onSave={handleUpdate}
                />
            )}
        </div>
    );
}

const EditAddressModal = ({ address, onClose, onSave }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        addressType: address.addressType,
        street: address.street,
        city: address.city,
        state: address.state,
        zipCode: address.zipCode,
        country: address.country
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const submit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{t('edit_address')} #{address.id}</h2>
                <form onSubmit={submit} className="modal-form">
                    <div className="form-group">
                        <label>{t('type')}</label>
                        <select name="addressType" value={formData.addressType} onChange={handleChange}>
                            <option value="shipping">{t('shipping')}</option>
                            <option value="billing">{t('billing')}</option>
                            <option value="provider">{t('provider')}</option>
                        </select>
                    </div>
                    <div className="form-group"><label>{t('street')}</label><input name="street" value={formData.street} onChange={handleChange} /></div>
                    <div className="form-group"><label>{t('city')}</label><input name="city" value={formData.city} onChange={handleChange} /></div>
                    <div className="form-group"><label>{t('state')}</label><input name="state" value={formData.state} onChange={handleChange} /></div>
                    <div className="form-group"><label>{t('zipCode')}</label><input name="zipCode" value={formData.zipCode} onChange={handleChange} /></div>
                    <div className="form-group"><label>{t('country')}</label><input name="country" value={formData.country} onChange={handleChange} /></div>
                    <div className="modal-actions">
                        <button type="submit" className="action-btn edit-btn">{t('save_changes')}</button>
                        <button type="button" onClick={onClose} className="action-btn cancel-btn">{t('cancel')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminAddressManagementPage;