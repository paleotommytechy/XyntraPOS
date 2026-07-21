import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { registerSchema } from '../schemas/auth.schema';
import type { RegisterInput } from '../schemas/auth.schema';
import { useAuth } from '../hooks/useAuth';
import { Input, Button } from '@xyntra/ui';

export function RegisterForm() {
  const { register: signUpUser, isRegistering } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: RegisterInput) => {
    signUpUser(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Full Name"
        type="text"
        placeholder="John Doe"
        id="name"
        error={errors.name?.message}
        disabled={isRegistering}
        {...register('name')}
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        id="email"
        error={errors.email?.message}
        disabled={isRegistering}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        id="password"
        error={errors.password?.message}
        disabled={isRegistering}
        {...register('password')}
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="••••••••"
        id="confirmPassword"
        error={errors.confirmPassword?.message}
        disabled={isRegistering}
        {...register('confirmPassword')}
      />

      <Button type="submit" className="w-full mt-2" isLoading={isRegistering}>
        Create Account
      </Button>

      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          Sign in instead
        </Link>
      </div>
    </form>
  );
}
