import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import OnboardingPage from '../pages/OnboardingPage';
import DashboardPage from '../pages/DashboardPage';
import PathwaysPage from '../pages/PathwaysPage';
import MyCareerRoadmapPage from '../pages/MyCareerRoadmapPage';
import DesignSystemShowcasePage from '../pages/DesignSystemShowcasePage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { PublicOnlyRoute } from '../components/PublicOnlyRoute';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/design-system" element={<DesignSystemShowcasePage />} />
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
      <Route
        path="/pathways"
        element={
          <ProtectedRoute requireProfile={true}>
            <PathwaysPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-roadmap"
        element={
          <ProtectedRoute requireProfile={true}>
            <MyCareerRoadmapPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
};

export default AppRoutes;
