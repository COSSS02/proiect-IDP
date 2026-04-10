import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getAdminDashboard } from '../../../api/dashboard';
import './style.css';

function AdminDashboardPage() {
    const { t } = useTranslation();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const dashboardData = await getAdminDashboard(token);
                setData(dashboardData);
            } catch (err) {
                console.error("Failed to load admin dashboard:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    if (loading) return <div className="dashboard-container"><p>Loading Dashboard...</p></div>;
    if (!data) return <div className="dashboard-container"><p>Could not load dashboard data.</p></div>;

    const { userStats, productStats, salesStats, recentOrders, recentUsers } = data;

    return (
        <div className="admin-dashboard-container">
            <h1>{t('admin')} - {t('dashboard')}</h1>
            <div className="dashboard-grid">
                {/* Stat Cards */}
                <StatCard title={t('total_revenue')} value={`$${Number(salesStats.totalRevenue || 0).toFixed(2)}`} />
                <StatCard title={t('total_orders')} value={salesStats.totalOrders || 0} />
                <StatCard title={t('total_users')} value={userStats.totalUsers || 0} />
                <StatCard title={t('total_products')} value={productStats.totalProducts || 0} />

                {/* List Cards */}
                <DashboardListCard title={t('recent_orders')} data={recentOrders} renderItem={item => (
                    <Link to="/admin/order-management">
                        {t('order')} #{item.id} {t('by')} {item.user.firstName} - ${Number(item.totalAmount).toFixed(2)}
                    </Link>
                )} emptyMessage={t('no_recent_orders')} />

                <DashboardListCard title={t('new_users')} data={recentUsers} renderItem={item => (
                    <Link to="/admin/user-management">
                        {item.firstName} {item.lastName} ({item.email})
                        <small>{t('role')}: <span className={`role-badge role-${item.role}`}>{t(item.role)}</span></small>
                    </Link>
                )} emptyMessage={t('no_new_users')} />
            </div>
        </div>
    );
}

const StatCard = ({ title, value }) => (
    <div className="dashboard-card stat-card">
        <h3>{title}</h3>
        <p>{value}</p>
    </div>
);

const DashboardListCard = ({ title, data, renderItem, emptyMessage }) => (
    <div className="dashboard-card list-card">
        <h3>{title}</h3>
        {data && data.length > 0 ? (
            <ul>
                {data.map((item, index) => <li key={item.id || index}>{renderItem(item)}</li>)}
            </ul>
        ) : (
            <p className="empty-message">{emptyMessage}</p>
        )}
    </div>
);

export default AdminDashboardPage;