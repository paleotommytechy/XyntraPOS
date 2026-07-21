import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { AuthLayout } from '../layouts/AuthLayout';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { ForgotPasswordPage } from '../features/auth/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '../features/auth/pages/ResetPasswordPage';
import { OnboardingPage } from '../features/onboarding/pages/OnboardingPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { ProductsPage } from '../features/products/pages/ProductsPage';
import { CustomersPage } from '../features/customers/pages/CustomersPage';
import { POSPage } from '../features/pos/pages/POSPage';
import { TransactionsPage } from '../features/transactions/pages/TransactionsPage';
import { InventoryPage } from '../features/inventory/pages/InventoryPage';
import { ReportsPage } from '../features/reports/pages/ReportsPage';

// Inline feature page placeholder builder for subsequent sprints
function PlaceholderPage({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{desc}</p>
      </div>
      <div className="h-96 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 flex items-center justify-center text-slate-400 bg-white dark:bg-slate-900/50 shadow-sm">
        {title} features are coming soon.
      </div>
    </div>
  );
}

export function AppRoutes() {
  const { user } = useAuthStore();

  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Onboarding Route */}
      <Route path="/onboarding" element={<OnboardingPage />} />

      {/* Protected Merchant Workspace Routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pos" element={<POSPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route
          path="/settings"
          element={
            <PlaceholderPage
              title="Settings"
              desc="Configure tax settings, receipt footers, timezone, and staff access."
            />
          }
        />
      </Route>

      {/* Root Redirection */}
      <Route
        path="*"
        element={<Navigate to={user ? '/dashboard' : '/login'} replace />}
      />
    </Routes>
  );
}
