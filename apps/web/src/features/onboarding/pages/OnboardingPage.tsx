import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth.store';
import { onboardingApi } from '../services/onboarding.api';
import { Input, Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@xyntra/ui';
import { toast } from 'sonner';

export function OnboardingPage() {
  const { user, profile, setBusiness, setProfile } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [timezone, setTimezone] = useState('Africa/Lagos');
  const [taxRate, setTaxRate] = useState(7.5);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return <Navigate to="/login" replace />;
  if (profile?.business_id) return <Navigate to="/dashboard" replace />;

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a business name');
      return;
    }

    setIsLoading(true);
    try {
      const data = await onboardingApi.createBusiness(
        {
          name,
          currency,
          timezone,
          taxRate,
          address,
          phone,
        },
        user.id
      );

      setProfile(data.profile);
      setBusiness(data.business);
      toast.success(`Business "${name}" registered successfully!`);
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.message || 'Failed to onboard business workspace');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center">
          <CardTitle>Welcome to XyntraPOS</CardTitle>
          <CardDescription>Configure your business workspace to begin operating</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateBusiness} className="space-y-4">
            <Input
              label="Business Name *"
              type="text"
              placeholder="e.g. Acme Supermart"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              required
            />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  disabled={isLoading}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="NGN">NGN (₦)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GHS">GHS (₵)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <Input
                label="Tax Rate (%)"
                type="number"
                step="0.01"
                placeholder="7.5"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                disabled={isLoading}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
                <option value="Europe/London">Europe/London (GMT+0)</option>
                <option value="America/New_York">America/New_York (EST)</option>
              </select>
            </div>

            <Input
              label="Store Phone Number"
              type="tel"
              placeholder="+234..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Store Address
              </label>
              <textarea
                placeholder="Store address, city, state"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isLoading}
                rows={2}
                className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              Initialize Workspace
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
