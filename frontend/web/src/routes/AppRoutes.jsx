import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import OnboardingPage from '../pages/OnboardingPage';
import DashboardPage from '../pages/DashboardPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { PublicOnlyRoute } from '../components/PublicOnlyRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requireProfile={true}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
};

export default AppRoutes;
