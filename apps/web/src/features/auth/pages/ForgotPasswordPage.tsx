import { ForgotPasswordForm } from '../components/ForgotPasswordForm';

export function ForgotPasswordPage() {
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Forgot Password
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          We will help you regain access to your POS merchant account
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
