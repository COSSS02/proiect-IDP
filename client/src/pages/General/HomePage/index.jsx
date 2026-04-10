import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { getAllProducts } from '../../../api/products';
import ProductList from '../../../components/products/ProductList';
import Pagination from '../../../components/pagination/Pagination';
import SortControl from '../../../components/sortcontrol/SortControl';
import './style.css';

function HomePage() {
    const { t } = useTranslation();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();
    const currentPage = parseInt(searchParams.get('page') || '1', 10);
    const currentSort = searchParams.get('sort') || 'name-asc';

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await getAllProducts(currentPage, currentSort);

                const { totalPages } = data.pagination;
                if (totalPages > 0 && currentPage > totalPages) {
                    setSearchParams({ sort: currentSort, page: totalPages });
                    return;
                }

                setProducts(data.products);
                setPagination(data.pagination);
            } catch (err) {
                setError("Failed to load products. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
        window.scrollTo(0, 0);
    }, [currentPage, currentSort, setSearchParams]);

    const handlePageChange = (newPage) => {
        setSearchParams({ sort: currentSort, page: newPage });
    };

    const handleSortChange = (e) => {
        setSearchParams({ sort: e.target.value, page: 1 });
    };

    return (
        <div>
            <div className="home-header">
                <h1 className='home-page-title'>{t('featured_products')}</h1>
            </div>
            <p className='home-page-description'>{t('home_page_description')}</p>
            <SortControl currentSort={currentSort} onSortChange={handleSortChange} />

            {loading && <p>Loading products...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {!loading && !error && (
                <>
                    <ProductList products={products} />
                    {pagination && (
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

export default HomePage;