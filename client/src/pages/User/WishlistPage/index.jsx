import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useAuth } from '../../../contexts/AuthContext';
import { getWishlist } from '../../../api/wishlist';
import ProductList from '../../../components/products/ProductList';
import './style.css';

function WishlistPage() {
    const { t } = useTranslation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    useEffect(() => {
        const fetchWishlist = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const data = await getWishlist(token);
                setProducts(data);
            } catch (err) {
                setError("Failed to load your wishlist.");
            } finally {
                setLoading(false);
            }
        };

        fetchWishlist();
    }, [token]);

    return (
        <div className="wishlist-container">
            <h1>{t('wishlist')}</h1>
            {loading && <p>Loading your wishlist...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && (
                <>
                    {products.length > 0
                        ? <ProductList products={products} />
                        : <p>{t('wishlist_empty')}</p>
                    }
                </>
            )}
        </div>
    );
}

export default WishlistPage;