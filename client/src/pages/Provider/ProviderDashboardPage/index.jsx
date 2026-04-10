import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getProviderDashboard } from '../../../api/dashboard';
import './style.css';

function DashboardPage() {
    const { t } = useTranslation();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const data = await getProviderDashboard(token);
                setDashboardData(data);
            } catch (err) {
                setError("Failed to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [token]);

    if (loading) return <div className="dashboard-container"><p>Loading Dashboard...</p></div>;
    if (error) return <div className="dashboard-container"><p className="error-message">{error}</p></div>;
    if (!dashboardData) return null;

    const { salesStats, lowStockProducts, topSellers, recentOrders } = dashboardData;

    const getProductNamesFromList = (items) => {
        return items.map(item => item.product.name).join(', ');
    }

    return (
        <div className="dashboard-container">
            <h1>{t('provider')} - {t('dashboard')}</h1>
            <div className="dashboard-grid">
                <StatCard title={t('total_revenue')} value={`$${Number(salesStats.totalRevenue).toFixed(2)}`} />
                <StatCard title={t('total_orders')} value={salesStats.totalOrders} />
                <StatCard title={t('items_sold')} value={salesStats.totalItemsSold} />

                <DashboardListCard title={t('low_stock_alerts')} data={lowStockProducts} renderItem={item => (
                    <Link to={`/provider/edit-product/${item.id}`}>
                        {item.name} <span>{t('stock')}: {item.stockQuantity}</span>
                    </Link>
                )} emptyMessage={t('no_low_products')} />

                <DashboardListCard title={t('top_selling_products')} data={topSellers} renderItem={item => (
                    <Link to={`/products/${item.productId}`}>
                        {item.product.name} <span>{t('sold')}: {item.total_sold}</span>
                    </Link>
                )} emptyMessage={t('no_sales_data')} />

                <DashboardListCard title={t('recent_orders')} data={recentOrders} renderItem={item => (
                    <Link to="/provider/manage-orders">
                        {t('order')} #{item.id} - ${Number(item.totalAmount).toFixed(2)}
                        <small>{getProductNamesFromList(item.items)}</small>
                    </Link>
                )} emptyMessage={t('no_recent_orders')} />
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
                {data.map((item, index) => <li key={index}>{renderItem(item)}</li>)}
            </ul>
        ) : (
            <p className="empty-message">{emptyMessage}</p>
        )}
    </div>
);

export default DashboardPage;