import { useAuthStore } from '../../../stores/auth.store';
import { useAuth } from '../../auth/hooks/useAuth';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { Building, Sun, Moon, Monitor, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@xyntra/ui';

export function MobileProfileView() {
  const { user, profile, business, theme, setTheme } = useAuthStore();
  const { logout, isLoggingOut } = useAuth();
  const { toggleDesktopOverride } = useIsMobile();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
        Profile & Settings
      </h1>

      {/* User Info Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
            {profile?.name?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              {profile?.name || 'Staff Member'}
            </h2>
            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <ShieldCheck className="h-3 w-3" />
              Role: {profile?.role || 'Cashier'}
            </span>
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <Building className="h-4 w-4 text-blue-600" />
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
            Business Info
          </h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Business Name</span>
            <span className="font-semibold text-slate-900 dark:text-white">{business?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Currency</span>
            <span className="font-semibold text-slate-900 dark:text-white">{business?.currency || 'NGN (₦)'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tax Rate</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {((business?.tax_rate || 0.075) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Preferences & Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 shadow-sm divide-y divide-slate-100 dark:divide-slate-800">
        <button
          onClick={toggleTheme}
          className="w-full p-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            {theme === 'light' ? <Moon className="h-4 w-4 text-slate-500" /> : <Sun className="h-4 w-4 text-amber-400" />}
            <span>App Theme</span>
          </div>
          <span className="text-slate-400 capitalize">{theme} Mode</span>
        </button>

        <button
          onClick={() => toggleDesktopOverride(true)}
          className="w-full p-3 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <Monitor className="h-4 w-4 text-blue-600" />
            <span>Switch to Desktop View</span>
          </div>
          <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-500">Full UI</span>
        </button>
      </div>

      {/* Logout */}
      <div className="pt-2">
        <Button
          onClick={() => logout()}
          disabled={isLoggingOut}
          className="w-full h-12 bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 font-bold text-xs flex items-center justify-center gap-2 rounded-2xl"
        >
          <LogOut className="h-4 w-4" />
          Log Out of XyntraPOS
        </Button>
      </div>
    </div>
  );
}
