import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { fulfillOrder } from '../../../api/checkout';
import './style.css';

function OrderSuccessPage() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('processing');
    const [error, setError] = useState('');
    const [orderId, setOrderId] = useState(null);
    const { token } = useAuth();
    const { refreshCart } = useCart();
    const hasFulfilled = useRef(false);

    useEffect(() => {
        if (hasFulfilled.current) {
            return;
        }

        const sessionId = searchParams.get('session_id');
        if (!sessionId || !token) {
            setStatus('error');
            setError('Invalid session or not logged in.');
            return;
        }

        hasFulfilled.current = true;

        const verifyPayment = async () => {
            try {
                const result = await fulfillOrder(sessionId, token);
                setOrderId(result.orderId);
                setStatus('success');
                await refreshCart();
            } catch (err) {
                setStatus('error');
                setError(err.message || 'An unknown error occurred during order fulfillment.');
            }
        };

        verifyPayment();

    }, [searchParams, token, refreshCart]);

    return (
        <div className="order-status-container">
            {status === 'processing' && (
                <>
                    <h2>{t('processing_order')}</h2>
                    <p>{t('wait_for_order')}</p>
                </>
            )}
            {status === 'success' && (
                <>
                    <h2>{t('thank_you')}</h2>
                    <p>{t('order_success')}</p>
                    <p>{t('orderId')}: <strong>#{orderId}</strong></p>
                    <Link to="/profile" className="status-link">{t('view_order_history')}</Link>
                </>
            )}
            {status === 'error' && (
                <>
                    <h2>{t('order_failed')}</h2>
                    <p>{t('payment_failed')}</p>
                    <p className="error-message">{error}</p>
                    <Link to="/cart" className="status-link">{t('return_to_cart')}</Link>
                </>
            )}
        </div>
    );
}

export default OrderSuccessPage