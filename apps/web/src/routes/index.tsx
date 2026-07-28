import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';
import { AuthCallbackPage } from '../features/auth/pages/AuthCallbackPage';
import { OnboardingPage } from '../features/onboarding/pages/OnboardingPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { ProductsPage } from '../features/products/pages/ProductsPage';
import { CustomersPage } from '../features/customers/pages/CustomersPage';
import { POSPage } from '../features/pos/pages/POSPage';
import { TransactionsPage } from '../features/transactions/pages/TransactionsPage';
import { InventoryPage } from '../features/inventory/pages/InventoryPage';
import { ReportsPage } from '../features/reports/pages/ReportsPage';
import { StaffPage } from '../features/staff/pages/StaffPage';
import { SettingsPage } from '../features/settings/pages/SettingsPage';

import { TutorialPage } from '../features/tutorial/pages/TutorialPage';

export function AppRoutes() {
  const { user } = useAuthStore();

  return (
    <Routes>
      {/* OAuth Callback Route */}
      <Route path="/auth/callback" element={<AuthCallbackPage />} />

      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Onboarding & Compulsory Tutorial Routes */}
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/tutorial" element={<TutorialPage />} />

      {/* Protected Merchant Workspace Routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pos" element={<POSPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/staff" element={<StaffPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Root Redirection */}
      <Route
        path="*"
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}
