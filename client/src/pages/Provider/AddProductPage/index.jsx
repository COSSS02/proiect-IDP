import React, { useState, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { getAllCategories } from '../../../api/categories';
import { getAttributesByCategoryId } from '../../../api/attributes';
import { createProduct } from '../../../api/products';
import './style.css';

function AddProductPage() {
    const { t } = useTranslation();
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
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const { token } = useAuth();
    const navigate = useNavigate();

    // Fetch all categories on component mount
    useEffect(() => {
        getAllCategories()
            .then(setCategories)
            .catch(() => setError("Could not load categories."));
    }, []);

    // Fetch attributes when a category is selected
    useEffect(() => {
        if (categoryId) {
            getAttributesByCategoryId(categoryId, token)
                .then(data => {
                    setCategoryAttributes(data);
                })
                .catch(err => {
                    console.error("Failed to fetch attributes:", err);
                    setError("Could not load attribute suggestions.");
                });
        } else {
            setCategoryAttributes([]);
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

    const addAttribute = () => {
        setAttributes([...attributes, { attributeName: '', value: '' }]);
    };

    const removeAttribute = (index) => {
        const newAttributes = attributes.filter((_, i) => i !== index);
        setAttributes(newAttributes);
    };

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
            const result = await createProduct(productPayload, token);
            setSuccess(`Product "${name}" created successfully!`);
            setTimeout(() => navigate(`/products/${result.productId}`), 2000);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="add-product-container">
            <form className="add-product-form" onSubmit={handleSubmit}>
                <h2>{t('add_new_product')}</h2>
                <p className="form-description">{t('fill_details')}</p>

                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

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

                <button type="submit" className="submit-button" disabled={loading || !categoryId}>
                    {loading ? 'Submitting...' : t('create_product')}
                </button>
            </form>
        </div>
    );
}

export default AddProductPage;