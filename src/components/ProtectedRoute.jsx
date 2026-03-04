import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function ProtectedRoute({ children, roles }) {
    const { user } = useApp();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }

    return children;
}
