import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getProductById, updateProduct, deleteProduct } from '../../../api/products';
import { getAllCategories } from '../../../api/categories';
import { getAttributesByCategoryId } from '../../../api/attributes';
import '../AddProductPage/style.css';

function EditProductPage() {
    const { t } = useTranslation();
    const { productId } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const [ownerId, setOwnerId] = useState(null);

    // Form state
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stockQuantity, setStockQuantity] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [attributes, setAttributes] = useState([{ attributeName: '', value: '' }]);

    // State for discount fields
    const [discountPrice, setDiscountPrice] = useState('');
    const [discountStartDate, setDiscountStartDate] = useState('');
    const [discountEndDate, setDiscountEndDate] = useState('');

    // Data and UI state
    const [categories, setCategories] = useState([]);
    const [categoryAttributes, setCategoryAttributes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Fetch all data needed for the form on initial load
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [productData, allCategories] = await Promise.all([
                    getProductById(productId),
                    getAllCategories()
                ]);

                setOwnerId(productData.providerId);

                // Security check: Does the logged-in user own this product?
                if (user && user.role !== 'admin' && productData.providerId !== user.id) {
                    setError("You are not authorized to edit this product.");
                    return;
                }

                // Pre-populate the form state
                setName(productData.name);
                setDescription(productData.description);
                setPrice(productData.price);
                setStockQuantity(productData.stockQuantity);
                setCategoryId(productData.categoryId);
                setAttributes(productData.productAttributes.map(attr => ({ attributeName: attr.attribute.name, value: attr.value })));
                setCategories(allCategories);

                setDiscountPrice(productData.discountPrice || '');
                setDiscountStartDate(productData.discountStartDate ? new Date(productData.discountStartDate).toISOString().slice(0, 16) : '');
                setDiscountEndDate(productData.discountEndDate ? new Date(productData.discountEndDate).toISOString().slice(0, 16) : '');

            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        if (user) {
            fetchData();
        }
    }, [productId, user]);

    // Fetch attribute suggestions when the category changes
    useEffect(() => {
        if (categoryId) {
            getAttributesByCategoryId(categoryId, token)
                .then(setCategoryAttributes)
                .catch(() => console.error("Could not load attribute suggestions."));
        }
    }, [categoryId, token]);

    const toMySQLDateTime = (inputValue) => {
        // Accepts 'YYYY-MM-DDTHH:mm' or 'YYYY-MM-DD HH:mm' or already with seconds
        if (!inputValue) return '';
        // Normalize separator
        const base = inputValue.replace('T', ' ').trim();
        // Append seconds if missing
        if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(base)) {
            return `${base}:00`;
        }
        // If already in 'YYYY-MM-DD HH:mm:ss', return as is
        return base;
    }

    const handleAttributeChange = (index, event) => {
        const newAttributes = [...attributes];
        newAttributes[index][event.target.name] = event.target.value;
        setAttributes(newAttributes);
    };

    const addAttribute = () => setAttributes([...attributes, { attributeName: '', value: '' }]);
    const removeAttribute = (index) => setAttributes(attributes.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const productPayload = {
            productData: {
                categoryId: parseInt(categoryId, 10),
                name,
                description,
                price: parseFloat(price),
                stockQuantity: parseInt(stockQuantity, 10),
                discountPrice: discountPrice ? parseFloat(discountPrice) : null,
                discountStartDate: discountStartDate ? toMySQLDateTime(discountStartDate) : null,
                discountEndDate: discountEndDate ? toMySQLDateTime(discountEndDate) : null
            },
            attributesData: attributes.filter(attr => attr.attributeName && attr.value)
        };

        try {
            await updateProduct(productId, productPayload, token);
            setSuccess(`Product updated successfully!`);
            setTimeout(() => navigate(`/products/${productId}`), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!user) return;
        const allowed = user.role === 'admin' || (ownerId && user.id === ownerId);
        if (!allowed) return setError("You are not authorized to delete this product.");
        if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;

        try {
            setLoading(true);
            await deleteProduct(productId, token);
            setSuccess("Product deleted successfully.");
            setTimeout(() => {
                if (user.role === 'provider') navigate('/provider/my-products');
                else navigate(-1);
            }, 800);
        } catch (err) {
            setError(err.message || 'Failed to delete product.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="add-product-container"><p>Loading product data...</p></div>;

    return (
        <div className="add-product-container">
            <form className="add-product-form" onSubmit={handleSubmit}>
                <h2>{t('edit_product')}</h2>
                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                {!error && (
                    <>
                        <fieldset>
                            <legend>{t('core_info')}</legend>
                            <div className="form-group">
                                <label htmlFor="name">{t('product_name')}</label>
                                <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="category">{t('category')}</label>
                                <select id="category" value={categoryId} onChange={e => setCategoryId(e.target.value)} required>
                                    <option value="">-- {t('select_category')} --</option>
                                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                            <div className="form-group-row">
                                <div className="form-group">
                                    <label htmlFor="price">{t('price')} ($)</label>
                                    <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} required min="0.01" step="0.01" />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="stockQuantity">{t('quantity')}</label>
                                    <input type="number" id="stockQuantity" value={stockQuantity} onChange={e => setStockQuantity(e.target.value)} required min="0" step="1" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label htmlFor="description">{t('description')} ({t('optional')})</label>
                                <textarea id="description" rows="4" value={description} onChange={e => setDescription(e.target.value)}></textarea>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend>{t('discount')}</legend>
                            <div className="form-group-row">
                                <div className="form-group">
                                    <label htmlFor="discountPrice">{t('discountPrice')} ($)</label>
                                    <input type="number" id="discountPrice" value={discountPrice} onChange={e => setDiscountPrice(e.target.value)} min="0.01" step="0.01" placeholder={t('leave_empty_for_no_discount')} />
                                </div>
                            </div>
                            <div className="form-group-row">
                                <div className="form-group">
                                    <label htmlFor="discountStartDate">{t('discount_start')}</label>
                                    <input type="datetime-local" id="discountStartDate" value={discountStartDate} onChange={e => setDiscountStartDate(e.target.value)} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="discountEndDate">{t('discount_end')}</label>
                                    <input type="datetime-local" id="discountEndDate" value={discountEndDate} onChange={e => setDiscountEndDate(e.target.value)} />
                                </div>
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend>{t('specifications')}</legend>
                            {attributes.map((attr, index) => (
                                <div key={index} className="attribute-row">
                                    <input
                                        type="text"
                                        name="attributeName"
                                        placeholder={t('attribute')}
                                        value={attr.attributeName}
                                        onChange={e => handleAttributeChange(index, e)}
                                        list="attribute-suggestions"
                                        disabled={!categoryId}
                                        autoComplete='off'
                                    />
                                    <datalist id="attribute-suggestions">
                                        {categoryAttributes.map(catAttr => <option key={catAttr.id} value={catAttr.name} />)}
                                    </datalist>
                                    <input
                                        type="text"
                                        name="value"
                                        placeholder={t('value')}
                                        value={attr.value}
                                        onChange={e => handleAttributeChange(index, e)}
                                        disabled={!categoryId}
                                    />
                                    <button type="button" className="remove-btn" onClick={() => removeAttribute(index)}>&times;</button>
                                </div>
                            ))}
                            <button type="button" className="add-btn" onClick={addAttribute} disabled={!categoryId}>
                                + {t('add_specification')}
                            </button>
                        </fieldset>

                        <div className="form-actions-row">
                            <button type="submit" className="submit-button" disabled={loading}>
                                {loading ? 'Saving...' : t('save_changes')}
                            </button>

                            {(user && (user.role === 'admin' || (ownerId && user.id === ownerId))) && (
                                <button
                                    type="button"
                                    className="delete-button"
                                    onClick={handleDelete}
                                    disabled={loading}
                                    title="Delete product"
                                >
                                    {t('delete_product')}
                                </button>
                            )}
                        </div>
                    </>
                )}
            </form>
        </div>
    );
}

export default EditProductPage;