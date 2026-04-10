import React, { useState, useEffect } from 'react';
import './QuantitySelector.css';

function QuantitySelector({ initialQuantity, maxQuantity, onQuantityChange }) {
    const [quantity, setQuantity] = useState(initialQuantity);

    // This effect ensures the component's state updates if the prop changes from the outside
    useEffect(() => {
        setQuantity(initialQuantity);
    }, [initialQuantity]);

    const handleQuantityUpdate = (newQuantity) => {
        // Clamp the value between 1 and the max stock
        const validatedQuantity = Math.max(1, Math.min(newQuantity, maxQuantity));
        setQuantity(validatedQuantity);

        // Only call the API update if the value has actually changed
        if (validatedQuantity !== initialQuantity) {
            onQuantityChange(validatedQuantity);
        }
    };

    const handleInputChange = (e) => {
        const value = e.target.value;
        // Allow the user to clear the input while typing
        if (value === '') {
            setQuantity('');
        } else {
            const numValue = parseInt(value, 10);
            if (!isNaN(numValue)) {
                setQuantity(numValue);
            }
        }
    };

    const handleBlur = () => {
        handleQuantityUpdate(quantity || 1);
    };

    return (
        <div className="quantity-selector">
            <button onClick={() => handleQuantityUpdate(quantity - 1)} disabled={quantity <= 1}>{"−"}</button>
            <input
                type="text"
                className="quantity-input"
                value={quantity}
                onChange={handleInputChange}
                onBlur={handleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            />
            <button onClick={() => handleQuantityUpdate(quantity + 1)} disabled={quantity >= maxQuantity}>{"+"}</button>
        </div>
    );
}

export default QuantitySelector;