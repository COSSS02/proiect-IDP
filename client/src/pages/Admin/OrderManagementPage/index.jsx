import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { getAllOrders, updateOrderItemStatus, deleteOrder } from '../../../api/orders';
import Pagination from '../../../components/pagination/Pagination';
import './style.css';

function AdminOrderManagementPage() {
    const { t } = useTranslation();
    const [orders, setOrders] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const { token } = useAuth();
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    const { currentPage, currentSort, currentSearch } = useMemo(() => ({
        currentPage: parseInt(searchParams.get('page') || '1', 10),
        currentSort: searchParams.get('sort') || 'createdAt-desc',
        currentSearch: searchParams.get('q') || ''
    }), [searchParams]);

    const [inputValue, setInputValue] = useState(currentSearch);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const data = await getAllOrders(currentPage, currentSort, currentSearch, token);
            setOrders(data.orders);
            setPagination(data.pagination);
        } catch (err) {
            addToast("Failed to load orders.", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, [currentPage, currentSort, currentSearch, token]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (inputValue !== currentSearch) {
                setSearchParams({ q: inputValue, sort: currentSort, page: 1 }, { replace: true });
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [inputValue, currentSearch, currentSort, setSearchParams]);

    const handlePageChange = (newPage) => setSearchParams({ q: currentSearch, sort: currentSort, page: newPage });

    const handleStatusChange = async (orderItemId, newStatus) => {
        try {
            await updateOrderItemStatus(orderItemId, newStatus, token);
            addToast("Status updated successfully!", "success");
            setOrders(prevOrders => prevOrders.map(order => ({
                ...order,
                items: order.items.map(item =>
                    item.id === orderItemId ? { ...item, status: newStatus } : item
                )
            })));
        } catch (err) {
            addToast(`Failed to update status: ${err.message}`, "error");
        }
    };

    const handleDeleteOrder = async (orderId) => {
        if (!window.confirm('Delete this order?')) return;
        try {
            await deleteOrder(orderId, token);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            if (pagination && orders.length === 1 && pagination.currentPage > 1) {
                setSearchParams({ q: currentSearch, sort: currentSort, page: pagination.currentPage - 1 });
            }
            addToast('Order deleted.', 'success');
        } catch (err) {
            addToast(`Failed to delete order: ${err.message}`, 'error');
        }
    };

    return (
        <div className="admin-order-container">
            <h1>{t('order_management')}</h1>
            <div className="toolbar">
                <input
                    type="text"
                    placeholder={t('ph_order_management')}
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    className="search-input"
                />
            </div>

            {loading ? <p>Loading orders...</p> : (
                <>
                    <div className="admin-orders-list">
                        {orders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                onStatusChange={handleStatusChange}
                                onDelete={handleDeleteOrder}
                            />
                        ))}
                    </div>
                    {pagination && pagination.totalPages > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={pagination.totalPages}
                            onPageChange={handlePageChange}
                        />
                    )}
                </>
            )}
        </div>
    );
}

const OrderCard = ({ order, onStatusChange, onDelete }) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const statusOptions = ['Pending', 'Processing', 'Shipped', 'Cancelled'];

    return (
        <div className="admin-order-card">
            <div className="order-summary-row" onClick={() => setIsExpanded(!isExpanded)}>
                <span className="order-id">#{order.id}</span>
                <span className="order-customer">{order.user.firstName} {order.user.lastName}</span>
                <span className="order-email">{order.user.email}</span>
                <span className="order-address">{order.shippingAddress.shipping_street}, {order.shippingAddress.shipping_city}</span>
                <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                <span className="order-total">${Number(order.totalAmount).toFixed(2)}</span>
                <button
                    className="delete-order-btn"
                    title={t('delete')}
                    onClick={(e) => { e.stopPropagation(); onDelete(order.id); }}
                >
                    ✖
                </button>
                <span className="order-toggle">{isExpanded ? '▲' : '▼'}</span>
            </div>
            {isExpanded && (
                <div className="order-details-admin">
                    <h4>{t('order_items')}</h4>
                    <div className="items-header">
                        <span>{t('product')}</span>
                        <span>{t('quantity')}</span>
                        <span>{t('price')}</span>
                        <span>{t('status')}</span>
                    </div>
                    <ul className="order-item-list-admin">
                        {order.items.map(item => (
                            <li key={item.id}>
                                <Link to={`/products/${item.productId}`} className="item-name">{item.product.name}</Link>
                                <span>{item.quantity}</span>
                                <span>${Number(item.priceAtPurchase).toFixed(2)}</span>
                                <select
                                    value={item.status}
                                    onChange={(e) => onStatusChange(item.id, e.target.value)}
                                    className={`status-select status-${item.status.toLowerCase()}`}
                                    onClick={e => e.stopPropagation()}
                                >
                                    {statusOptions.map(opt => <option key={opt} value={opt}>{t(opt)}</option>)}
                                </select>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default AdminOrderManagementPage;