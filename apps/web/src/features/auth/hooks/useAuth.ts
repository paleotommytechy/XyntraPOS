import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authApi } from '../services/auth.api';
import { useAuthStore } from '../../../stores/auth.store';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema';

export function useAuth() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const setSession = useAuthStore((state) => state.setSession);
  const clearSession = useAuthStore((state) => state.logout);

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: LoginInput) => authApi.signIn(email, password),
    onSuccess: (data) => {
      setSession(data.user, data.profile, data.business);
      toast.success(`Welcome back, ${data.profile?.name || 'User'}!`);
      
      // If the user hasn't created a business, take them to onboarding
      if (!data.profile?.business_id) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
      queryClient.invalidateQueries({ queryKey: ['auth_session'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Login failed. Please check your credentials.');
    },
  });

  const registerMutation = useMutation({
    mutationFn: ({ email, password, name }: RegisterInput) =>
      authApi.signUp(email, password, name),
    onSuccess: (data) => {
      if (!data.session) {
        toast.success('Registration successful! Please check your email to confirm your account before signing in.', {
          duration: 6000,
        });
        navigate('/login');
      } else {
        setSession(data.user, data.profile, null);
        toast.success('Account registered successfully!');
        navigate('/onboarding');
      }
      queryClient.invalidateQueries({ queryKey: ['auth_session'] });
    },
    onError: (error: any) => {
      console.error('useAuth registration mutation error:', error);
      console.error('Error message:', error?.message);
      console.error('Error details:', error?.details || error?.hint || 'No extra details');
      toast.error(error.message || 'Registration failed. Please try again.');
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: () => {
      clearSession();
      toast.success('Logged out successfully.');
      navigate('/login');
      queryClient.clear();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Logout failed.');
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (email: string) => authApi.forgotPassword(email),
    onSuccess: () => {
      toast.success('Password reset instructions sent to your email.');
      navigate('/login');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to send reset email.');
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: (password: string) => authApi.resetPassword(password),
    onSuccess: () => {
      toast.success('Password updated successfully. Please login.');
      navigate('/login');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update password.');
    },
  });

  const googleLoginMutation = useMutation({
    mutationFn: () => authApi.signInWithGoogle(),
    onError: (error: any) => {
      toast.error(error.message || 'Google sign-in failed. Please try again.');
    },
  });

  return {
    login: loginMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginWithGoogle: googleLoginMutation.mutate,
    isLoggingInWithGoogle: googleLoginMutation.isPending,
    register: registerMutation.mutate,
    isRegistering: registerMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
    forgotPassword: forgotPasswordMutation.mutate,
    isSendingForgotPassword: forgotPasswordMutation.isPending,
    resetPassword: resetPasswordMutation.mutate,
    isResettingPassword: resetPasswordMutation.isPending,
  };
}
