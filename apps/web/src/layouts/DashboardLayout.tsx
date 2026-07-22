import { useState } from 'react';
import { Navigate, Link, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { useAuth } from '../features/auth/hooks/useAuth';
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  Layers,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  UserCheck,
  Receipt,
  Package,
} from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';
import { MobileLayout } from './MobileLayout';
import { Smartphone } from 'lucide-react';

export function DashboardLayout() {
  const { user, profile, business, theme, setTheme } = useAuthStore();
  const { logout, isLoggingOut } = useAuth();
  const { isMobileMode, desktopOverride, toggleDesktopOverride } = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user does not have a business linked, redirect to onboarding
  if (!profile?.business_id) {
    return <Navigate to="/onboarding" replace />;
  }

  // Render Mobile Layout when on mobile viewport and not in desktop override mode
  if (isMobileMode) {
    return <MobileLayout />;
  }

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'POS Checkout', path: '/pos', icon: ShoppingBag },
    { label: 'Products', path: '/products', icon: Layers },
    { label: 'Inventory', path: '/inventory', icon: Package },
    { label: 'Customers', path: '/customers', icon: Users },
    { label: 'Transactions', path: '/transactions', icon: Receipt },
    { label: 'Reports', path: '/reports', icon: BarChart3 },
    { label: 'Staff & Team', path: '/staff', icon: UserCheck },
    { label: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        <div className="h-16 flex items-center justify-center gap-3 px-5 border-b border-slate-200 dark:border-slate-800">
          <img src="/l.png" alt="XyntraPOS" className="h-8 w-auto object-contain dark:brightness-110 dark:contrast-125 transition-all" />
        </div>



        {/* Business details */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Business</p>
          <p className="font-semibold text-sm truncate mt-0.5">{business?.name || 'Retail Merchant'}</p>
          <p className="text-xs text-slate-500 truncate">{profile?.name} ({profile?.role})</p>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Panel */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex items-center gap-3">
              {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
          </button>

          <button
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 md:hidden">
          <div className="flex items-center">
            <img
              src="/logo.png"
              alt="XyntraPOS"
              className="h-8 max-w-[130px] object-contain dark:brightness-110 dark:contrast-125 transition-all"
            />
          </div>


          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </header>

        {/* Desktop Override Banner for Mobile Devices */}
        {desktopOverride && (
          <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-between text-xs font-semibold shadow-sm">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span>You are viewing the Desktop Version of XyntraPOS.</span>
            </div>
            <button
              onClick={() => toggleDesktopOverride(false)}
              className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-md transition-colors"
            >
              Switch to Touch Mobile View
            </button>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Sidebar overlay drawer */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsSidebarOpen(false)}
          />

          {/* Drawer content */}
          <aside className="relative flex flex-col w-64 bg-white dark:bg-slate-900 h-full border-r border-slate-200 dark:border-slate-800">
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center">
                <img
                  src="/logo.png"
                  alt="XyntraPOS"
                  className="h-8 max-w-[130px] object-contain dark:brightness-110 dark:contrast-125 transition-all"
                />
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Business</p>
              <p className="font-semibold text-sm truncate mt-0.5">{business?.name || 'Retail Merchant'}</p>
              <p className="text-xs text-slate-500 truncate">{profile?.name}</p>
            </div>

            <nav className="flex-1 px-4 py-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  logout();
                }}
                disabled={isLoggingOut}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
