import React from 'react';
import { useTranslation } from "react-i18next";
import { Link } from 'react-router-dom';
import './ProductCard.css';

function ProductCard({ product }) {
    const { t } = useTranslation();

    const isDiscountActive = (p) => {
        const hasFields = p && p.discountPrice && p.discountStartDate && p.discountEndDate;
        if (!hasFields) return false;
        const now = new Date();
        const start = new Date(p.discountStartDate);
        const end = new Date(p.discountEndDate);
        return !isNaN(start) && !isNaN(end) && now >= start && now <= end && Number(p.discountPrice) < Number(p.price);
    };

    const activeDiscount = isDiscountActive(product);
    const price = Number(product.price || 0);
    const discountPrice = Number(product.discountPrice || 0);
    const discountPercentage = activeDiscount && price > 0
        ? Math.round(((price - discountPrice) / price) * 100)
        : 0;

    const getImageUrl = (categoryName) => {
        if (!categoryName) {
            return '';
        }
        // Converts "CPU Cooler" to "cpu_cooler.png"
        const imageName = categoryName.toLowerCase().replace(/ /g, '_') + '.png';
        return `/images/${imageName}`;
    };

    return (
        <div className="product-card">
            {activeDiscount && (
                <div className="discount-badge">-{discountPercentage}%</div>
            )}
            <img src={getImageUrl(product.category.name)} alt={product.name} className="product-image" />
            <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <div className="product-meta">
                    <div className="product-price">
                        {activeDiscount ? (
                            <>
                                <span className="original-price">${price.toFixed(2)}</span>
                                <span className="discounted-price">${discountPrice.toFixed(2)}</span>
                            </>
                        ) : (
                            <span className="regular-price">${price.toFixed(2)}</span>
                        )}
                    </div>
                    <span
                        className="product-quantity"
                        style={product.stockQuantity > 0 ? { color: "#2ecc71" } : { color: "#e74c3c" }}
                    >
                        {t('quantity')}: {product.stockQuantity}
                    </span>
                </div>
            </div>
            <Link to={`/products/${product.id}`} className="view-details-btn">
                {t('view_details')}
            </Link>
        </div>
    );
}

export default ProductCard;