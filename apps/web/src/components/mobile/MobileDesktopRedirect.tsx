import { useNavigate } from 'react-router-dom';
import { Monitor, ArrowLeft, ShoppingBag, ShieldAlert } from 'lucide-react';
import { Button } from '@xyntra/ui';
import { useIsMobile } from '../../hooks/useIsMobile';

interface MobileDesktopRedirectProps {
  featureName: string;
  description?: string;
}

export function MobileDesktopRedirect({
  featureName,
  description = 'For the optimal experience, please open XyntraPOS on a larger screen to manage advanced configuration, bulk actions, and deep analytics.',
}: MobileDesktopRedirectProps) {
  const navigate = useNavigate();
  const { toggleDesktopOverride } = useIsMobile();

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="h-16 w-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-6 shadow-sm">
        <Monitor className="h-8 w-8" />
      </div>

      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 text-xs font-semibold mb-3">
        <ShieldAlert className="h-3.5 w-3.5" />
        Desktop Optimized Feature
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
        {featureName} is optimized for Desktop
      </h2>

      <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
        {description}
      </p>

      <div className="w-full max-w-xs space-y-3 mt-8">
        <Button
          onClick={() => toggleDesktopOverride(true)}
          className="w-full h-12 flex items-center justify-center gap-2 font-medium"
        >
          <Monitor className="h-4 w-4" />
          Switch to Desktop Version
        </Button>

        <Button
          variant="secondary"
          onClick={() => navigate('/pos')}
          className="w-full h-12 flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 font-medium"
        >
          <ShoppingBag className="h-4 w-4" />
          Return to POS Console
        </Button>

        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pt-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Go to Mobile Home
        </button>
      </div>
    </div>
  );
}
