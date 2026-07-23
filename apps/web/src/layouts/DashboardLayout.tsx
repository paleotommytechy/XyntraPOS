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
  Search,
  Clock,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';
import { MobileLayout } from './MobileLayout';
import { CommandPalette } from '../components/CommandPalette';
import { NotificationCenter } from '../components/NotificationCenter';

export function DashboardLayout() {
  const { user, profile, business, theme, setTheme } = useAuthStore();
  const { logout, isLoggingOut } = useAuth();
  const { isMobileMode, desktopOverride, toggleDesktopOverride } = useIsMobile();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(true);
  const location = useLocation();

  // If user is not authenticated, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // If user does not have a business linked, redirect to onboarding
  if (!profile?.business_id) {
    return <Navigate to="/onboarding" replace />;
  }

  // If staff profile is awaiting owner approval, render pending approval screen
  if (profile?.status === 'Pending Approval') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-6">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
          <div className="h-16 w-16 mx-auto rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="h-8 w-8 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-100">Awaiting Owner Approval</h2>
            <p className="text-sm text-slate-300">
              Your account is connected to <span className="font-semibold text-white">{business?.name || 'the business'}</span>.
            </p>
            <p className="text-xs text-slate-400 leading-relaxed pt-2">
              Your access request has been submitted to the Business Owner (Admin). Once approved, you will automatically gain access to your POS portal and features based on your assigned role ({profile.role}).
            </p>
          </div>
          <div className="pt-4 flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Check Approval Status
            </button>
            <button
              onClick={() => logout()}
              disabled={isLoggingOut}
              className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-semibold rounded-xl transition-all"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Compulsory Onboarding Tutorial Guard: Redirect new users to /tutorial
  const hasCompletedTutorial =
    profile?.has_completed_tutorial ||
    localStorage.getItem(`xyntra_tutorial_completed_${profile?.id || user?.id}`) === 'true';

  if (!hasCompletedTutorial) {
    return <Navigate to="/tutorial" replace />;
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
      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
      />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0">
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
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
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
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 items-center justify-between px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          {/* Quick Search / Command Palette Button */}
          <button
            onClick={() => setIsCommandPaletteOpen(true)}
            className="flex items-center gap-3 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 transition-colors w-72"
          >
            <Search className="h-4 w-4 text-slate-400" />
            <span>Search or type command...</span>
            <kbd className="ml-auto px-2 py-0.5 text-[10px] font-semibold bg-white dark:bg-slate-900 text-slate-400 rounded border border-slate-200 dark:border-slate-700">
              Ctrl+K
            </kbd>
          </button>

          {/* Right Header Actions */}
          <div className="flex items-center gap-4">
            {/* Shift Clock-in badge */}
            <button
              onClick={() => setIsClockedIn(!isClockedIn)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isClockedIn
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-400'
                  : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
              }`}
              title="Click to toggle Shift Clock status"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{isClockedIn ? 'Clocked In (Active Shift)' : 'Clocked Out'}</span>
            </button>

            {/* App Tutorial button */}
            <Link
              to="/tutorial"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition-colors"
              title="Replay Interactive App Tutorial"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-500" />
              <span>App Tutorial</span>
            </Link>

            {/* Notification Center */}
            <NotificationCenter />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Light/Dark Theme"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>
        </header>

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
              onClick={() => setIsCommandPaletteOpen(true)}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <Search className="h-5 w-5" />
            </button>
            <NotificationCenter />
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
