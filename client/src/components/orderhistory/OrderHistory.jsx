import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { Link } from 'react-router-dom';
import './OrderHistory.css';

const getOverallStatus = (items) => {
    if (!items || items.length === 0) return 'Unknown';
    const statuses = new Set(items.map(item => item.status));
    if (statuses.has('Pending')) return 'Pending';
    if (statuses.has('Processing')) return 'Processing';
    if (statuses.size === 1 && statuses.has('Shipped')) return 'Shipped';
    if (statuses.size > 1 && statuses.has('Shipped')) return 'Partially Shipped';
    return items[0].status;
};

function OrderCard({ order }) {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(false);
    const overallStatus = getOverallStatus(order.items);

    return (
        <div className="order-card">
            <div className="order-summary-row" onClick={() => setIsExpanded(!isExpanded)}>
                <span className="order-id">{t('order')} #{order.id}</span>
                <span className="order-date">{new Date(order.createdAt).toLocaleDateString()}</span>
                <span className="order-total">${order.totalAmount}</span>
                <span className={`order-status status-${overallStatus.toLowerCase().replace(' ', '-')}`}>{t(overallStatus)}</span>
                <span className="order-toggle">{isExpanded ? '▲' : '▼'}</span>
            </div>
            {isExpanded && (
                <div className="order-details">
                    <h4>{t('order_items')}</h4>
                    <ul className="order-item-list">
                        {order.items.map(item => (
                            <li key={item.productId}>
                                <Link to={`/products/${item.productId}`} className="item-name">{item.product.name}</Link>
                                <span className="item-qty">{t('qty')}: {item.quantity}</span>
                                <span className={`item-status status-${item.status.toLowerCase()}`}>{t(item.status)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

function OrderHistory({ orders }) {
    return (
        <div className="order-history-list">
            {orders.map(order => (
                <OrderCard key={order.id} order={order} />
            ))}
        </div>
    );
}

export default OrderHistory;