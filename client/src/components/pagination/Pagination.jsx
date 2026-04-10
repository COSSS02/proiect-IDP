import React, { useState, useEffect } from 'react';
import {useTranslation} from "react-i18next";
import './Pagination.css';

function Pagination({ currentPage, totalPages, onPageChange }) {
    const { t } = useTranslation();
    const [inputValue, setInputValue] = useState(currentPage);

    // When the currentPage prop changes (e.g., from the URL),
    // update the input field to stay in sync.
    useEffect(() => {
        setInputValue(currentPage);
    }, [currentPage]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        const pageNumber = parseInt(inputValue, 10);

        // Validate the input before changing the page
        if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages) {
            if (pageNumber !== currentPage) {
                onPageChange(pageNumber);
            }
        } else {
            setInputValue(currentPage);
        }
    };

    // Don't render the component if there's only one page or less
    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className="pagination-controls">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
                &laquo; {t('previous')}
            </button>

            <form onSubmit={handleFormSubmit} className="pagination-form">
                <span>{t('page')}</span>
                <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onBlur={handleFormSubmit}
                    className="page-input"
                    min="1"
                    max={totalPages}
                />
                <span>{t('of')} {totalPages}</span>
            </form>

            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
                {t('next')} &raquo;
            </button>
        </div>
    );
}

export default Pagination;