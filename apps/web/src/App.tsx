import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppRoutes } from './routes';
import { useAuthStore } from './stores/auth.store';
import { authApi } from './features/auth/services/auth.api';

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
    // Initial theme synchronization to document node
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
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
  }, [setSession, setLoading, theme]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
          <span className="text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400 animate-pulse uppercase">
            Loading Workspace...
          </span>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster position="top-right" richColors closeButton />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
