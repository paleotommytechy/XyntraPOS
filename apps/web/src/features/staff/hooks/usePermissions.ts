import { useAuthStore } from '../../../stores/auth.store';

export type Role = 'Admin' | 'Manager' | 'Cashier';

export function usePermissions() {
  const { profile } = useAuthStore();
  const role: Role = profile?.role || 'Cashier';

  return {
    role,
    isAdmin: role === 'Admin',
    isManager: role === 'Manager',
    isCashier: role === 'Cashier',

    // Granular capabilities
    canManageStaff: role === 'Admin',
    canManageSettings: role === 'Admin',
    canManageInventory: role === 'Admin' || role === 'Manager',
    canManageProducts: role === 'Admin' || role === 'Manager',
    canManageCategories: role === 'Admin' || role === 'Manager',
    canViewReports: role === 'Admin' || role === 'Manager',
    canProcessSales: true, // Admin, Manager, and Cashier can process sales
    canViewTransactions: true,
    canViewCustomers: true,
  };
}
