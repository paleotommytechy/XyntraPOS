import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';
import { RetailHero3DCanvas } from '../features/auth/components/RetailHero3DCanvas';

export function AuthLayout() {
  const { user, profile } = useAuthStore();

  // If user is already authenticated, redirect them automatically
  if (user) {
    if (!profile?.business_id) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      {/* Form Area */}
      <div className="lg:col-span-5 flex flex-col justify-center px-6 py-12 sm:px-12 xl:px-20 relative overflow-hidden bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        <div className="mx-auto w-full max-w-md space-y-8 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm flex items-center justify-center">
              <img src="/logo.png" alt="XyntraPOS" className="h-10 w-10 object-contain" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Xyntra<span className="text-blue-600">POS</span>
            </span>
          </div>

          <Outlet />
        </div>

        {/* Decorative background blur objects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
      </div>

      {/* Hero Display Panel with Interactive 3D Canvas */}
      <div className="hidden lg:col-span-7 lg:block relative p-0 overflow-hidden bg-slate-950">
        <RetailHero3DCanvas />
      </div>
    </div>
  );
}
