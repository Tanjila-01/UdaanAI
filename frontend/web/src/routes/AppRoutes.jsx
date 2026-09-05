import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '../pages/HomePage';
import RegisterPage from '../pages/RegisterPage';
import LoginPage from '../pages/LoginPage';
import OnboardingPage from '../pages/OnboardingPage';
import DashboardPage from '../pages/DashboardPage';
import PathwaysPage from '../pages/PathwaysPage';
import MyCareerRoadmapPage from '../pages/MyCareerRoadmapPage';
import AssessmentPage from '../pages/AssessmentPage';
import DesignSystemShowcasePage from '../pages/DesignSystemShowcasePage';
import AdminOverviewPage from '../pages/admin/AdminOverviewPage';
import AdminRequestsPage from '../pages/admin/AdminRequestsPage';
import AdminScheduledPage from '../pages/admin/AdminScheduledPage';
import AdminCompletedPage from '../pages/admin/AdminCompletedPage';
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { PublicOnlyRoute } from '../components/PublicOnlyRoute';
import { AdminRoute } from '../components/AdminRoute';

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
        path="/assessment"
        element={
          <ProtectedRoute requireProfile={true}>
            <AssessmentPage />
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
      {/* Admin Operations Routes */}
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminOverviewPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/requests"
        element={
          <AdminRoute>
            <AdminRequestsPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/scheduled"
        element={
          <AdminRoute>
            <AdminScheduledPage />
          </AdminRoute>
        }
      />
      <Route
        path="/admin/completed"
        element={
          <AdminRoute>
            <AdminCompletedPage />
          </AdminRoute>
        }
      />
      <Route path="*" element={<HomePage />} />
    </Routes>
  );
};


export default AppRoutes;
