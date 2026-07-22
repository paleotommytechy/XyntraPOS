import { Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { MobileBottomNav } from '../components/mobile/MobileBottomNav';
import { useIsMobile } from '../hooks/useIsMobile';
import { Sun, Moon, Monitor } from 'lucide-react';

export function MobileLayout() {
  const { business, theme, setTheme } = useAuthStore();
  const { toggleDesktopOverride } = useIsMobile();
  const navigate = useNavigate();

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Mobile Top App Header */}
      <header className="sticky top-0 z-30 h-14 flex items-center justify-between px-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <img
            src="/logo.png"
            alt="XyntraPOS"
            className="h-7 w-auto object-contain dark:brightness-110 dark:contrast-125"
          />
          <div className="border-l border-slate-200 dark:border-slate-800 pl-2">
            <p className="text-xs font-bold truncate max-w-[120px]">
              {business?.name || 'XyntraPOS'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => toggleDesktopOverride(true)}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Switch to Desktop View"
          >
            <Monitor className="h-4 w-4" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title="Toggle theme"
          >
            {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main View Area */}
      <main className="flex-1 pb-24 p-4 overflow-y-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
