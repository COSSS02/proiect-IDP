import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '../../../contexts/ToastContext';
import { getAllProducts, deleteProduct } from '../../../api/products';
import Pagination from '../../../components/pagination/Pagination';
import SortControl from '../../../components/sortcontrol/SortControl';
import './style.css';

function AdminProductManagementPage() {
    const { t } = useTranslation();
    const [products, setProducts] = useState([]);
    const [pagination, setPagination] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();
    const { addToast } = useToast();
    const [searchParams, setSearchParams] = useSearchParams();

    // Read search params from URL
    const { currentPage, currentSort, currentSearch } = useMemo(() => ({
        currentPage: parseInt(searchParams.get('page') || '1', 10),
        currentSort: searchParams.get('sort') || 'name-asc',
        currentSearch: searchParams.get('q') || ''
    }), [searchParams]);

    // State for the search input field, which we will debounce
    const [inputValue, setInputValue] = useState(currentSearch);

    // Effect to fetch products whenever URL params change
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await getAllProducts(currentPage, currentSort, currentSearch);
                setProducts(data.products);
                setPagination(data.pagination);
            } catch (err) {
                setError("Failed to load products.");
                addToast("Failed to load products.", "error");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [currentPage, currentSort, currentSearch]);

    // Debouncing effect for the search input
    useEffect(() => {
        const timer = setTimeout(() => {
            // Only update the URL if the input value is different from the current search param
            if (inputValue !== currentSearch) {
                setSearchParams({ q: inputValue, sort: currentSort, page: 1 }, { replace: true });
            }
        }, 500);

        return () => {
            clearTimeout(timer);
        };
    }, [inputValue, currentSearch, currentSort, setSearchParams]);

    const isDiscountActive = (p) => {
        if (!p) return false;
        const { discountPrice, discountStartDate, discountEndDate, price } = p;
        if (!discountPrice || !discountStartDate || !discountEndDate) return false;
        const now = new Date();
        const start = new Date((discountStartDate || '').replace(' ', 'T'));
        const end = new Date((discountEndDate || '').replace(' ', 'T'));
        return !isNaN(start) && !isNaN(end) && now >= start && now <= end && Number(discountPrice) < Number(price);
    };

    const handleDelete = async (productId, productName) => {
        if (window.confirm(`Are you sure you want to delete "${productName}"? This action is permanent.`)) {
            try {
                await deleteProduct(productId, token);
                addToast("Product deleted successfully.", "success");
                // Re-fetch products for the current page after deletion
                const data = await getAllProducts(currentPage, currentSort, currentSearch);
                setProducts(data.products);
                setPagination(data.pagination);
                // If the last item on a page is deleted, go to the previous page
                if (data.products.length === 0 && currentPage > 1) {
                    handlePageChange(currentPage - 1);
                }
            } catch (err) {
                addToast(`Failed to delete product: ${err.message}`, "error");
            }
        }
    };

    const handlePageChange = (newPage) => setSearchParams({ q: currentSearch, sort: currentSort, page: newPage });
    const handleSortChange = (e) => setSearchParams({ q: currentSearch, sort: e.target.value, page: 1 });
    const handleSearchChange = (e) => {
        setInputValue(e.target.value);
    };

    if (error) return <div className="admin-product-container"><p className="error-message">{error}</p></div>;

    return (
        <div className="admin-product-container">
            <h1>{t('product_management')}</h1>
            <div className="toolbar">
                <input
                    type="text"
                    placeholder={t('ph_product_management')}
                    value={inputValue}
                    onChange={handleSearchChange}
                    className="search-input"
                />
                <SortControl currentSort={currentSort} onSortChange={handleSortChange} />
            </div>

            {loading ? <p>Loading products...</p> : (
                <>
                    <div className="admin-table-container">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>{t('product_name')}</th>
                                    <th>{t('category')}</th>
                                    <th>{t('provider')}</th>
                                    <th>{t('price')}</th>
                                    <th>{t('stock')}</th>
                                    <th>{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map(product => {
                                    const price = Number(product.price || 0);
                                    const dprice = Number(product.discountPrice || 0);
                                    const active = isDiscountActive(product);
                                    const pct = active && price > 0 ? Math.round(((price - dprice) / price) * 100) : 0;

                                    return (
                                        <tr key={product.id}>
                                            <td>{product.id}</td>
                                            <td>{product.name}</td>
                                            <td>{product.category.name}</td>
                                            <td>{product.provider.companyName || `${product.provider.firstName} ${product.provider.lastName}`}</td>
                                            <td>
                                                {active ? (
                                                    <span className="price-cell">
                                                        <span className="original-price">${price.toFixed(2)}</span>
                                                        <span className="discounted-price">${dprice.toFixed(2)}</span>
                                                    </span>
                                                ) : (
                                                    <span className="regular-price">${price.toFixed(2)}</span>
                                                )}
                                            </td>
                                            <td>{product.stockQuantity}</td>
                                            <td className="actions-cell">
                                                <Link to={`/provider/edit-product/${product.id}`} className="action-btn edit-btn">{t('edit')}</Link>
                                                <button onClick={() => handleDelete(product.id, product.name)} className="action-btn delete-btn">{t('delete')}</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
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

export default AdminProductManagementPage;