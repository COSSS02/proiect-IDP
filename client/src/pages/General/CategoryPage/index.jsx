import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router-dom';
import { getProductsByCategory } from '../../../api/products';
import { getCategoryFilters } from '../../../api/attributes';
import ProductList from '../../../components/products/ProductList';
import Pagination from '../../../components/pagination/Pagination';
import SortControl from '../../../components/sortcontrol/SortControl';
import './style.css';

function CategoryPage() {
    const { t } = useTranslation();
    const { categoryName } = useParams();
    const [products, setProducts] = useState([]);
    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState(null);

    const [searchParams, setSearchParams] = useSearchParams();

    const { currentPage, currentSort, activeFilters } = useMemo(() => {
        const page = parseInt(searchParams.get('page') || '1', 10);
        const sort = searchParams.get('sort') || 'name-asc';
        const filters = {};
        for (const [key, value] of searchParams.entries()) {
            if (key !== 'page' && key !== 'sort') {
                filters[key] = value;
            }
        }
        return { currentPage: page, currentSort: sort, activeFilters: filters };
    }, [searchParams]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [productData] = await Promise.all([
                    getProductsByCategory(categoryName, currentPage, currentSort, activeFilters),
                ]);

                const { totalPages } = productData.pagination;
                if (totalPages > 0 && currentPage > totalPages) {
                    const newParams = new URLSearchParams({ ...activeFilters, sort: currentSort, page: totalPages });
                    setSearchParams(newParams);
                    return;
                }

                setProducts(productData.products);
                setCategory(productData.category);
                setPagination(productData.pagination);
            } catch (err) {
                setError(`Failed to load products for ${categoryName}.`);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        window.scrollTo(0, 0);
    }, [categoryName, currentPage, currentSort, activeFilters, setSearchParams]);

    const handleSortChange = (e) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('sort', e.target.value);
        newParams.set('page', '1');
        setSearchParams(newParams);
    };

    const handlePageChange = (newPage) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('page', newPage);
        setSearchParams(newParams);
    };

    const transformCategoryName = (categoryName) => {
        return categoryName.toLowerCase().replace(/ /g, '_');
    }

    const getCategoryDescription = (categoryName) => {
        return transformCategoryName(categoryName) + '_description';
    }

    return (
        <div className="category-page-container">
            <h1>{t(transformCategoryName(categoryName))}</h1>
            {category && <p className="category-description">{t(getCategoryDescription(categoryName))}</p>}
            <SortControl currentSort={currentSort} onSortChange={handleSortChange} />

            {loading && <p>Loading products...</p>}
            {error && <p className="error-message">{error}</p>}
            {!loading && !error && (
                <>
                    {products.length > 0
                        ? <ProductList products={products} />
                        : <p>{t('no_product_in_category')}</p>
                    }
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

export default CategoryPage;