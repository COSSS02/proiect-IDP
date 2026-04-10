import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function ProtectedRoute({ children, roles }) {
    const { user, token } = useAuth();
    const location = useLocation();

    // If there is no token, the user is definitely not logged in.
    if (!token) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    if (!user) {
        return <div>Loading...</div>;
    }

    if (roles && !roles.includes(user.role)) {
        // The user is logged in but does not have permission.
        // Redirect them to the homepage.
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;