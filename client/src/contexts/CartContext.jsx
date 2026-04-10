import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { getCart } from '../api/cart';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
    const [cartItemCount, setCartItemCount] = useState(0);
    const { token } = useAuth();

    const fetchCartItems = async () => {
        if (token) {
            try {
                const items = await getCart(token);
                const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
                setCartItemCount(totalItems);
            } catch (error) {
                console.error("Failed to fetch cart items for context:", error);
                setCartItemCount(0);
            }
        } else {
            setCartItemCount(0);
        }
    };

    useEffect(() => {
        fetchCartItems();
    }, [token]);

    return (
        <CartContext.Provider value={{ cartItemCount, refreshCart: fetchCartItems }}>
            {children}
        </CartContext.Provider>
    );
};