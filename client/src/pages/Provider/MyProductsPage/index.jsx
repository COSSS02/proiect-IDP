import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from "react-i18next";
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getProviderProducts } from '../../../api/products';
import ProductList from '../../../components/products/ProductList';
import Pagination from '../../../components/pagination/Pagination';
import SortControl from '../../../components/sortcontrol/SortControl';
import './style.css';

function MyProductsPage() {
    const { t } = useTranslation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);
    const { token } = useAuth();

    const [searchParams, setSearchParams] = useSearchParams();

    const { currentPage, currentSort } = useMemo(() => {
        const page = parseInt(searchParams.get('page') || '1', 10);
        const sort = searchParams.get('sort') || 'name-asc';
        return { currentPage: page, currentSort: sort };
    }, [searchParams]);

    useEffect(() => {
        const fetchProducts = async () => {
            if (!token) return;
            try {
                setLoading(true);
                const data = await getProviderProducts(token, currentPage, currentSort);

                const { totalPages } = data.pagination;
                if (totalPages > 0 && currentPage > totalPages) {
                    setSearchParams({ sort: currentSort, page: totalPages });
                    return;
                }

                setProducts(data.products);
                setPagination(data.pagination);
            } catch (err) {
                setError("Failed to load your products. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
        window.scrollTo(0, 0);
    }, [currentPage, currentSort, token, setSearchParams]);

    const handlePageChange = (newPage) => {
        setSearchParams({ sort: currentSort, page: newPage });
    };

    const handleSortChange = (e) => {
        setSearchParams({ sort: e.target.value, page: 1 });
    };

    return (
        <div className="my-products-container">
            <div className="my-products-header">
                <h1>{t('my_products')}</h1>
                <SortControl currentSort={currentSort} onSortChange={handleSortChange} />
            </div>

            {loading && <p>Loading your products...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && (
                <>
                    {products.length > 0
                        ? <ProductList products={products} />
                        : <p>{t('no_products_added')}</p>
                    }
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

export default MyProductsPage;