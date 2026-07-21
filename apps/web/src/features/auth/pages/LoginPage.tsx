import { LoginForm } from '../components/LoginForm';

export function LoginPage() {
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Enter your credentials to access your merchant workspace
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
