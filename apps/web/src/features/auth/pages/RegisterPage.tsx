import { RegisterForm } from '../components/RegisterForm';

export function RegisterPage() {
  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Create an account
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Get started with XyntraPOS today and scale your business
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
