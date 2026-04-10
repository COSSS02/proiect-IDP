import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { getCart, updateCartItem, removeFromCart } from '../../../api/cart';
import { getMyAddresses } from '../../../api/address';
import { useToast } from '../../../contexts/ToastContext';
import { createCheckoutSession } from '../../../api/checkout';
import { loadStripe } from '@stripe/stripe-js';
import QuantitySelector from '../../../components/quantityselector/QuantitySelector';
import { Link, useNavigate } from 'react-router-dom';
import './style.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CartPage() {
    const { t } = useTranslation();
    const [cartItems, setCartItems] = useState([]);
    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [shippingAddressId, setShippingAddressId] = useState('');
    const [billingAddressId, setBillingAddressId] = useState('');
    const [useShippingForBilling, setUseShippingForBilling] = useState(false);

    const { token } = useAuth();
    const { refreshCart } = useCart();
    const navigate = useNavigate();
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [cartData, addressData] = await Promise.all([
                    getCart(token),
                    getMyAddresses(token)
                ]);
                setCartItems(cartData);
                setAddresses(addressData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (token) fetchData();
    }, [token]);

    const isDiscountActive = (p) => {
        if (!p) return false;
        const { discountPrice, discountStartDate, discountEndDate, price } = p.product;
        if (!discountPrice || !discountStartDate || !discountEndDate) return false;
        const now = new Date();
        const start = new Date(discountStartDate);
        const end = new Date(discountEndDate);
        return !isNaN(start) && !isNaN(end) && now >= start && now <= end && Number(discountPrice) < Number(price);
    };

    const handleUpdateQuantity = async (productId, quantity) => {
        try {
            await updateCartItem(productId, quantity, token);
            const updatedCart = await getCart(token);
            setCartItems(updatedCart);
            await refreshCart();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleRemoveItem = async (productId) => {
        try {
            await removeFromCart(productId, token);
            setCartItems(cartItems.filter(item => item.productId !== productId));
            await refreshCart();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleProceedToPayment = async () => {
        const finalBillingId = useShippingForBilling ? shippingAddressId : billingAddressId;
        if (!shippingAddressId || !finalBillingId) {
            setError("Please select both a shipping and billing address.");
            return;
        }
        setError(null);

        try {
            const { id: sessionId } = await createCheckoutSession(token, {
                shippingAddressId,
                billingAddressId: finalBillingId
            });

            const stripe = await stripePromise;
            const { error } = await stripe.redirectToCheckout({ sessionId });

            if (error) {
                setError(error.message);
                addToast(error.message, "error");
            }
        } catch (err) {
            setError(err.message);
            addToast(err.message, "error");
        }
    };

    const total = cartItems.reduce((sum, item) => {
        const active = isDiscountActive(item);
        const unit = active ? Number(item.product.discountPrice) : Number(item.product.price);
        return sum + unit * item.quantity;
    }, 0);
    const shippingAddresses = addresses.filter(a => a.addressType === 'shipping');
    const billingAddresses = addresses.filter(a => a.addressType === 'billing');

    if (loading) return <div className="cart-container"><p>Loading your cart...</p></div>;

    return (
        <div className="cart-container">
            <h1>{t('your_cart')}</h1>
            {error && <p className="error-message">{error}</p>}
            {cartItems.length === 0 ? (
                <p>{t('cart_empty')} <Link to="/">{t('go_shopping')}</Link></p>
            ) : (
                <div className="cart-layout">
                    <div className="cart-items-list">
                        {cartItems.map(item => {
                            const active = isDiscountActive(item);
                            const price = Number(item.product.price || 0);
                            const dprice = Number(item.product.discountPrice || 0);
                            const pct = active && price > 0 ? Math.round(((price - dprice) / price) * 100) : 0;

                            return (
                                <div key={item.productId} className="cart-item">
                                    <div className="cart-item-info">
                                        <Link to={`/products/${item.productId}`}><h4>{item.product.name}</h4></Link>
                                        <p>
                                            {t('price')}:{" "}
                                            {active ? (
                                                <span className="cart-item-price">
                                                    <span className="original-price">${price.toFixed(2)}</span>
                                                    <span className="discounted-price">${dprice.toFixed(2)}</span>
                                                </span>
                                            ) : (
                                                <strong>${price.toFixed(2)}</strong>
                                            )}
                                        </p>
                                    </div>
                                    <div className="cart-item-actions">
                                        <QuantitySelector
                                            initialQuantity={item.quantity}
                                            maxQuantity={item.product.stockQuantity}
                                            onQuantityChange={(newQuantity) => handleUpdateQuantity(item.productId, newQuantity)}
                                        />
                                        <button className='remove-button' onClick={() => handleRemoveItem(item.productId)}>{t('remove')}</button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="cart-summary">
                        <h2>{t('order_summary')}</h2>
                        <p>{t('total')}: <strong>${total.toFixed(2)}</strong></p>
                        <div className="address-selection">
                            <Link to="/profile">{t('manage_addresses')}</Link>
                            <h4>{t('shipping')}</h4>
                            <select value={shippingAddressId} onChange={e => setShippingAddressId(e.target.value)} required>
                                <option value="">{t('select_shipping_address')}</option>
                                {shippingAddresses.map(addr => <option key={addr.id} value={addr.id}>{addr.street}, {addr.city}</option>)}
                            </select>

                            <h4>{t('billing')}</h4>
                            {!useShippingForBilling && (
                                <select value={billingAddressId} onChange={e => setBillingAddressId(e.target.value)} required>
                                    <option value="">{t('select_billing_address')}</option>
                                    {billingAddresses.map(addr => <option key={addr.id} value={addr.id}>{addr.street}, {addr.city}</option>)}
                                </select>
                            )}
                            <label>
                                <input type="checkbox" checked={useShippingForBilling} onChange={e => setUseShippingForBilling(e.target.checked)} />
                                {t('use_shipping_for_billing')}
                            </label>
                        </div>
                        <button className="checkout-btn" onClick={handleProceedToPayment}>
                            {t('proceed_to_payment')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartPage;