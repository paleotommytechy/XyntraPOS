import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { resetPasswordSchema } from '../schemas/auth.schema';
import type { ResetPasswordInput } from '../schemas/auth.schema';
import { useAuth } from '../hooks/useAuth';
import { Input, Button } from '@xyntra/ui';

export function ResetPasswordForm() {
  const { resetPassword, isResettingPassword } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ResetPasswordInput) => {
    resetPassword(data.password);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Please set a new, secure password for your account below.
      </p>

      <Input
        label="New Password"
        type="password"
        placeholder="••••••••"
        id="password"
        error={errors.password?.message}
        disabled={isResettingPassword}
        {...register('password')}
      />

      <Input
        label="Confirm New Password"
        type="password"
        placeholder="••••••••"
        id="confirmPassword"
        error={errors.confirmPassword?.message}
        disabled={isResettingPassword}
        {...register('confirmPassword')}
      />

      <Button
        type="submit"
        className="w-full mt-2"
        isLoading={isResettingPassword}
      >
        Reset Password
      </Button>
    </form>
  );
}
