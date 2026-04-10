import React from 'react';
import { useTranslation } from "react-i18next";
import './SortControl.css';

function SortControl({ currentSort, onSortChange }) {
    const { t } = useTranslation();
    return (
        <div className="sort-controls">
            <label htmlFor="sort-select">{t('sort_by')}</label>
            <select id="sort-select" value={currentSort} onChange={onSortChange}>
                <option value="createdAt-desc">{t('newest')}</option>
                <option value="discount-desc">{t('highest_discount')}</option>
                <option value="name-asc">{t('alphabetical')}</option>
                <option value="price-asc">{t('price_low_high')}</option>
                <option value="price-desc">{t('price_high_low')}</option>
                <option value="stockQuantity-asc">{t('stock_low_high')}</option>
                <option value="stockQuantity-desc">{t('stock_high_low')}</option>
            </select>
        </div>
    );
}

export default SortControl;