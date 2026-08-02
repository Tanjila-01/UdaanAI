import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ProtectedRoute = ({ children, requireProfile = false }) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex items-center justify-center font-sans">
        <div className="text-sm font-bold text-teal-800 animate-pulse">
          Verifying authenticated student session...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requireProfile && (!profile || !profile.is_complete)) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};
