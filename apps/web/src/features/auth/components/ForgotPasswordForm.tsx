import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { forgotPasswordSchema } from '../schemas/auth.schema';
import type { ForgotPasswordInput } from '../schemas/auth.schema';
import { useAuth } from '../hooks/useAuth';
import { Input, Button } from '@xyntra/ui';

export function ForgotPasswordForm() {
  const { forgotPassword, isSendingForgotPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = (data: ForgotPasswordInput) => {
    forgotPassword(data.email);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Enter the email address associated with your account, and we will send you a link to reset your password.
      </p>

      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        id="email"
        error={errors.email?.message}
        disabled={isSendingForgotPassword}
        {...register('email')}
      />

      <Button
        type="submit"
        className="w-full mt-2"
        isLoading={isSendingForgotPassword}
      >
        Send Reset Link
      </Button>

      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        Remember your password?{' '}
        <Link
          to="/login"
          className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          Sign in
        </Link>
      </div>
    </form>
  );
}
