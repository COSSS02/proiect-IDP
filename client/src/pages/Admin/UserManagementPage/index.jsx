import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { getAllUsers, deleteUserAsAdmin, updateUserAsAdmin } from '../../../api/user';
import './style.css';

function AdminUserManagementPage() {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingUser, setEditingUser] = useState(null);
    const [filterRole, setFilterRole] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [inputValue, setInputValue] = useState('');
    const { token } = useAuth();
    const { addToast } = useToast();

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await getAllUsers(token);
            setUsers(data.users || data);
        } catch (error) {
            addToast(error.message, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [token]);

    // Debouncing effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setSearchTerm(inputValue);
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [inputValue]);

    const handleUpdate = async (updatedUserData) => {
        try {
            await updateUserAsAdmin(editingUser.id, updatedUserData, token);
            addToast("User updated successfully.", "success");
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            addToast(error.message, "error");
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm("Are you sure you want to permanently delete this user?")) {
            try {
                await deleteUserAsAdmin(userId, token);
                addToast("User deleted successfully.", "success");
                fetchUsers();
            } catch (error) {
                addToast(error.message, "error");
            }
        }
    };

    if (loading) return <div className="admin-page-container"><p>Loading users...</p></div>;

    const filteredUsers = users.filter(user => {
        const roleOk = filterRole === 'all' || user.role === filterRole;
        const term = searchTerm.trim().toLowerCase();
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const match = !term ||
            fullName.includes(term) ||
            user.email.toLowerCase().includes(term) ||
            (user.companyName || '').toLowerCase().includes(term);
        return roleOk && match;
    });

    return (
        <div className="admin-page-container">
            <h1>{t('user_management')}</h1>
            <div className="toolbar">
                <input
                    type="text"
                    placeholder={t('ph_user_management')}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                />
                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                    <option value="all">{t('all_roles')}</option>
                    <option value="client">{t('client')}</option>
                    <option value="provider">{t('provider')}</option>
                    <option value="admin">{t('admin')}</option>
                </select>
            </div>
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>{t('name')}</th>
                            <th>{t('email')}</th>
                            <th>{t('role')}</th>
                            <th>{t('company')}</th>
                            <th>{t('joined')}</th>
                            <th>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id}>
                                <td>{user.id}</td>
                                <td>{user.firstName} {user.lastName}</td>
                                <td>{user.email}</td>
                                <td><span className={`role-badge role-${user.role}`}>{t(user.role)}</span></td>
                                <td>{user.companyName || 'N/A'}</td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td className="actions-cell">
                                    <button onClick={() => setEditingUser(user)} className="action-btn edit-btn">{t('edit')}</button>
                                    <button onClick={() => handleDelete(user.id)} className="action-btn delete-btn">{t('delete')}</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleUpdate}
                />
            )}
        </div>
    );
}

const EditUserModal = ({ user, onClose, onSave }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        companyName: user.companyName || ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{t('edit_user')}: {user.firstName} {user.lastName}</h2>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>{t('firstName')}</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>{t('lastName')}</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>{t('email')}</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} />
                    </div>
                    <div className="form-group">
                        <label>{t('role')}</label>
                        <select name="role" value={formData.role} onChange={handleChange}>
                            <option value="client">{t('client')}</option>
                            <option value="provider">{t('provider')}</option>
                            <option value="admin">{t('admin')}</option>
                        </select>
                    </div>
                    {formData.role === 'provider' && (
                        <div className="form-group">
                            <label>{t('company')}</label>
                            <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} />
                        </div>
                    )}
                    <div className="modal-actions">
                        <button type="submit" className="action-btn edit-btn">{t('save_changes')}</button>
                        <button type="button" onClick={onClose} className="action-btn cancel-btn">{t('cancel')}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminUserManagementPage;