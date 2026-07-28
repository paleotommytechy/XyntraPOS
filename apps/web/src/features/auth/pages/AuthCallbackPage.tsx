import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { authApi } from '../services/auth.api';
import { useAuthStore } from '../../../stores/auth.store';
import { XyntraSpinner } from '../../../components/XyntraSpinner';

export function AuthCallbackPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const handleAuthCallback = async () => {
      try {
        // Strip access token and hash parameters from address bar immediately
        if (window.location.hash || window.location.search) {
          window.history.replaceState(null, '', window.location.pathname);
        }

        // Wait brief moment for Supabase JS client to parse auth state if needed
        const sessionData = await authApi.getCurrentSession();

        if (!isMounted) return;

        if (sessionData && sessionData.user) {
          setSession(sessionData.user, sessionData.profile, sessionData.business);
          if (sessionData.profile?.business_id) {
            navigate('/dashboard', { replace: true });
          } else {
            navigate('/onboarding', { replace: true });
          }
        } else {
          // Double check session from Supabase client directly
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (session?.user) {
            const reloadedSession = await authApi.getCurrentSession();
            if (reloadedSession && isMounted) {
              setSession(reloadedSession.user, reloadedSession.profile, reloadedSession.business);
              if (reloadedSession.profile?.business_id) {
                navigate('/dashboard', { replace: true });
              } else {
                navigate('/onboarding', { replace: true });
              }
              return;
            }
          }

          if (isMounted) {
            setErrorMsg('Authentication session could not be verified. Please try signing in again.');
          }
        }
      } catch (err: any) {
        console.error('Error during Google Auth Callback:', err);
        if (isMounted) {
          setErrorMsg(err?.message || 'An unexpected error occurred during Google sign-in.');
        }
      }
    };

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, setSession]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900 text-white text-center">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl space-y-4">
          <h2 className="text-xl font-bold text-red-400">Authentication Error</h2>
          <p className="text-sm text-slate-300">{errorMsg}</p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white gap-4">
      <XyntraSpinner size="lg" />
      <p className="text-sm font-medium text-slate-300 animate-pulse">
        Completing Google sign-in... Setting up your merchant workspace
      </p>
    </div>
  );
}
