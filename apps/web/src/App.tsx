import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppRoutes } from './routes';
import { useAuthStore } from './stores/auth.store';
import { authApi } from './features/auth/services/auth.api';
import { supabase } from './lib/supabase';
import { ErrorBoundary } from './components/ErrorBoundary';
import { monitoring } from './lib/monitoring';
import { XyntraSpinner } from './components/XyntraSpinner';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { isLoading, setSession, setLoading, theme } = useAuthStore();

  useEffect(() => {
    monitoring.init();

    // Initial theme synchronization to document node
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Immediately sanitize URL if returning from OAuth hash redirect
    if (window.location.hash && window.location.hash.includes('access_token')) {
      setTimeout(() => {
        if (window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
      }, 300);
    }

    const checkSession = async () => {
      try {
        const session = await authApi.getCurrentSession();
        if (session) {
          setSession(session.user, session.profile, session.business);
        } else {
          setSession(null, null, null);
        }
      } catch (err) {
        console.error('Failed to load active merchant session:', err);
        setSession(null, null, null);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for auth state changes (OAuth redirect completion, token refresh, sign-out)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (window.location.hash && window.location.hash.includes('access_token')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.search);
        }
        const activeSession = await authApi.getCurrentSession();
        if (activeSession) {
          setSession(activeSession.user, activeSession.profile, activeSession.business);
        }
      } else if (event === 'SIGNED_OUT') {
        setSession(null, null, null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setSession, setLoading, theme]);

  if (isLoading) {
    return <XyntraSpinner size="full" />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
