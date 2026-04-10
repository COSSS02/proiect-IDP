import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useAuth } from '../../../contexts/AuthContext';
import { getProviderOrderItems, updateOrderItemStatus } from '../../../api/orders';
import { useToast } from '../../../contexts/ToastContext';
import { Link } from 'react-router-dom';
import './style.css';

function ManageOrdersPage() {
    const { t } = useTranslation();
    const [orderItems, setOrderItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();
    const { addToast } = useToast();

    const fetchOrderItems = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const data = await getProviderOrderItems(token);
            setOrderItems(data);
        } catch (err) {
            setError("Failed to load your orders. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrderItems();
    }, [token]);

    const handleStatusChange = async (orderItemId, newStatus) => {
        try {
            await updateOrderItemStatus(orderItemId, newStatus, token);
            // Refresh the list to show the updated status
            fetchOrderItems();
        } catch (err) {
            addToast(`Failed to update status: ${err.message}`, "error");
        }
    };

    const statusOptions = ['Pending', 'Processing', 'Shipped', 'Cancelled'];

    return (
        <div className="manage-orders-container">
            <h1>{t('manage_orders')}</h1>
            {loading && <p>Loading orders...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && (
                <div className="order-items-table">
                    <div className="table-header">
                        <span>{t('ord_id')}</span>
                        <span>{t('product')}</span>
                        <span>{t('customer')}</span>
                        <span>{t('shipping')}</span>
                        <span>{t('status')}</span>
                    </div>
                    {orderItems.length > 0 ? (
                        orderItems.map(item => (
                            <div key={item.id} className="table-row">
                                <span className="cell-order-id">#{item.orderId}</span>
                                <div className="cell-product">
                                    <Link to={`/products/${item.productId}`} className="item-name"><strong>{item.product.name}</strong></Link>
                                    <span>{t('qty')}: {item.quantity}</span>
                                </div>
                                <span className="cell-customer">{item.order.user.firstName} {item.order.user.lastName}</span>
                                <div className="cell-address">
                                    {item.order.shippingAddress.shipping_street}, {item.order.shippingAddress.shipping_city}, {item.order.shippingAddress.shipping_state} {item.order.shippingAddress.shipping_postal_code}
                                </div>
                                <div className="cell-status">
                                    <select
                                        value={item.status}
                                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                                        className={`status-select status-${item.status.toLowerCase()}`}
                                    >
                                        {statusOptions.map(opt => <option key={opt} value={opt}>{t(opt)}</option>)}
                                    </select>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>{t('no_incoming_orders')}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default ManageOrdersPage;