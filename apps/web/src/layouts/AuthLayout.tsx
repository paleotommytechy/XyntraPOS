import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../stores/auth.store';

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
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-500/20">
              X
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Xyntra<span className="text-blue-600">POS</span>
            </span>
          </div>

          <Outlet />
        </div>

        {/* Decorative background blur objects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-10" />
      </div>

      {/* Hero Display Panel */}
      <div className="hidden lg:col-span-7 lg:flex flex-col justify-between p-12 bg-slate-950 text-white relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/30 via-slate-950 to-slate-950" />
        <div className="absolute -top-[40%] -right-[40%] w-[80%] h-[80%] rounded-full bg-blue-500/10 blur-[120px]" />
        
        <div className="z-10 text-right text-xs text-slate-400 font-semibold tracking-wider">
          VERSION 1.0.0
        </div>

        <div className="z-10 max-w-xl space-y-6">
          <h2 className="text-4xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
            The operating system for modern retail merchants.
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Manage transactions, analyze stock in real-time, maintain customer records, and manage employee accounts in one single, responsive cloud interface.
          </p>

          {/* Simple premium highlights */}
          <div className="grid grid-cols-2 gap-6 pt-4">
            <div className="space-y-1 border-l-2 border-blue-500 pl-4">
              <span className="text-sm font-semibold text-slate-300">Under 1s Checkout</span>
              <p className="text-xs text-slate-400">Ultra-fast client transactions.</p>
            </div>
            <div className="space-y-1 border-l-2 border-blue-500 pl-4">
              <span className="text-sm font-semibold text-slate-300">Real-time Stock</span>
              <p className="text-xs text-slate-400">Automated inventory deductions.</p>
            </div>
          </div>
        </div>

        <div className="z-10 text-xs text-slate-500">
          XyntraPOS &copy; {new Date().getFullYear()} &bull; Professional SaaS Merchant Suite.
        </div>
      </div>
    </div>
  );
}
