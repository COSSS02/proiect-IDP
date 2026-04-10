import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../../../api/products';
import { addToCart } from '../../../api/cart';
import { getProductsByCategory } from '../../../api/products';
import { getWishlist, addToWishlist, removeFromWishlist } from '../../../api/wishlist';
import ProductList from '../../../components/products/ProductList';
import { useAuth } from '../../../contexts/AuthContext';
import { useCart } from '../../../contexts/CartContext';
import { useToast } from '../../../contexts/ToastContext';
import './style.css';

function ProductDetailPage() {
    const { t } = useTranslation();
    const { user, token } = useAuth();
    const { productId } = useParams();
    const { refreshCart } = useCart();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [recommendations, setRecommendations] = useState([]);
    const { addToast } = useToast();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setProduct(null);
                setRecommendations([]);

                const productPromise = getProductById(productId);
                const wishlistPromise = token ? getWishlist(token) : Promise.resolve([]);

                const [productData, wishlistData] = await Promise.all([productPromise, wishlistPromise]);

                setProduct(productData);

                if (wishlistData && productData) {
                    const isProductInWishlist = wishlistData.some(item => item.id === productData.id);
                    setIsInWishlist(isProductInWishlist);
                }

                if (productData && productData.category.name) {
                    const recommendationsData = await getProductsByCategory(productData.category.name, 1, 'createdAt-desc', { limit: 5 });
                    const filteredRecs = recommendationsData.products
                        .filter(p => p.id !== productData.id)
                        .slice(0, 4);
                    setRecommendations(filteredRecs);
                }

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        window.scrollTo(0, 0);
    }, [productId, token]);

    const isDiscountActive = (p) => {
        if (!p) return false;
        const { discountPrice, discountStartDate, discountEndDate, price } = p;
        if (!discountPrice || !discountStartDate || !discountEndDate) return false;
        const now = new Date();
        const start = new Date(discountStartDate);
        const end = new Date(discountEndDate);
        return !isNaN(start) && !isNaN(end) && now >= start && now <= end && Number(discountPrice) < Number(price);
    };

    if (loading) {
        return <div className="product-detail-container"><p>Loading...</p></div>;
    }

    if (error) {
        return <div className="product-detail-container"><p className="error-message">{error}</p></div>;
    }

    if (!product) {
        return null;
    }

    const price = Number(product.price || 0);
    const discountPrice = Number(product.discountPrice || 0);
    const activeDiscount = isDiscountActive(product);
    const discountPercentage = activeDiscount && price > 0
        ? Math.round(((price - discountPrice) / price) * 100)
        : 0;

    const getImageUrl = (categoryName) => {
        if (!categoryName) {
            return '';
        }
        const imageName = categoryName.toLowerCase().replace(/ /g, '_') + '.png';
        return `/images/${imageName}`;
    };

    const handleAddToCart = async () => {

        if (!token) {
            addToast("Please log in to add items to your cart.");
            return;
        }

        if (!product || !product.id) {
            console.error("2. Product data is not available.");
            addToast("Error: Product information is missing. Cannot add to cart.", "error");
            return;
        }

        try {
            await addToCart(product.id, 1, token);

            await refreshCart();

            addToast(`${product.name} has been added to your cart!`);
        } catch (error) {
            console.error("ERROR during 'Add to Cart' process:", error);
            addToast(`An error occurred: ${error.message}`, "error");
        }
    };

    const handleToggleWishlist = async () => {
        if (!token) {
            addToast("Please log in to manage your wishlist.");
            return;
        }
        try {
            if (isInWishlist) {
                await removeFromWishlist(product.id, token);
                addToast(`${product.name} removed from wishlist.`, "info");
            } else {
                await addToWishlist(product.id, token);
                addToast(`${product.name} added to wishlist!`, "success");
            }
            setIsInWishlist(!isInWishlist);
        } catch (err) {
            addToast(`Error updating wishlist: ${err.message}`, "error");
        }
    };

    const transformCategoryName = (categoryName) => {
        return categoryName.toLowerCase().replace(/ /g, '_');
    }

    return (
        <div className="product-detail-container">
            <div className="product-detail-card">
                <div className="product-detail-header">
                    <div>
                        <h1 className="product-title">{product.name}</h1>
                        {product.provider.companyName && (
                            <div className="product-provider">
                                {t('sold_by')}: {product.provider.companyName}
                            </div>
                        )}
                    </div>
                    <span className="product-category">{t(transformCategoryName(product.category.name))}</span>
                </div>
                <img src={getImageUrl(product.category.name)} alt={product.name} className="product-detail-image" />
                <p className="product-description">{product.description}</p>

                <div className="product-purchase-section">
                    <div className="price-block">
                        {activeDiscount ? (
                            <div className="price-line">
                                <span className="original-price-lg">${price.toFixed(2)}</span>
                                <span className="discounted-price-lg">${discountPrice.toFixed(2)}</span>
                                <span className="discount-badge-lg">-{discountPercentage}%</span>
                            </div>
                        ) : (
                            <span className="product-price-large">${price.toFixed(2)}</span>
                        )}
                    </div>

                    <div className="purchase-actions">
                        <span className={`product-stock-status ${product.stockQuantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                            {product.stockQuantity > 0 ? t('in_stock') + `: ${product.stockQuantity}` : t('out_of_stock')}
                        </span>
                        <button onClick={handleToggleWishlist} className={`wishlist-btn ${isInWishlist ? 'active' : ''}`}>
                            ❤
                        </button>
                        <button
                            className="add-to-cart-btn"
                            disabled={product.stockQuantity === 0}
                            onClick={handleAddToCart}
                        >
                            {t('add_to_cart')}
                        </button>
                        {user && (user.role === 'admin' || user.id === product.providerId) && (
                            <Link to={`/provider/edit-product/${product.id}`} className="edit-product-btn">
                                {t('edit_product')}
                            </Link>
                        )}
                    </div>
                </div>

                <div className="product-attributes">
                    <h2>{t('specifications')}</h2>
                    <ul className="attributes-list">
                        {product.productAttributes.map((attr, index) => (
                            <li key={index} className="attribute-item">
                                <span className="attribute-name">{attr.attribute.name}</span>
                                <span className="attribute-value">{attr.value}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {recommendations.length > 0 && (
                <div className="recommendations-section">
                    <h2>{t('you_might_also_like')}</h2>
                    <ProductList products={recommendations} />
                </div>
            )}

        </div>
    );
}

export default ProductDetailPage;