import React, { createContext, useState, useContext, useCallback } from 'react';
import './Toast.css';

const ToastContext = createContext();

let idCounter = 0;

function Toast({ message, type, onClose }) {
    React.useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000); // Auto-dismiss after 5 seconds

        return () => {
            clearTimeout(timer);
        };
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            <span className="toast-message">{message}</span>
            <button onClick={onClose} className="toast-close-btn">&times;</button>
        </div>
    );
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = useCallback((message, type = 'info') => {
        const id = idCounter++;
        setToasts((prevToasts) => [...prevToasts, { id, message, type }]);
    }, []);

    const removeToast = useCallback((id) => {
        setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, []);

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="toast-container">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export const useToast = () => {
    return useContext(ToastContext);
};