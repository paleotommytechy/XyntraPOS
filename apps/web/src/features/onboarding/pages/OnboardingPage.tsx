import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth.store';
import { onboardingApi } from '../services/onboarding.api';
import { Input, Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@xyntra/ui';
import { Building2, UserCheck, KeyRound, Lock } from 'lucide-react';
import { toast } from 'sonner';

export function OnboardingPage() {
  const { user, profile, setBusiness, setProfile } = useAuthStore();
  const navigate = useNavigate();

  // Mode: 'create' for owners, 'join' for cashiers/managers/staff
  const [mode, setMode] = useState<'create' | 'join'>('create');

  // Create Business Form State
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('NGN');
  const [timezone, setTimezone] = useState('Africa/Lagos');
  const [taxRate, setTaxRate] = useState(7.5);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // One-Time Staff Code State
  const [oneTimeCode, setOneTimeCode] = useState('');

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
      toast.success(`Business "${name}" registered successfully! Please complete the interactive tutorial.`);
      navigate('/tutorial');
    } catch (error: any) {
      toast.error(error.message || 'Failed to onboard business workspace');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oneTimeCode.trim()) {
      toast.error('Please enter your One-Time Staff Code');
      return;
    }

    setIsLoading(true);
    try {
      const data = await onboardingApi.joinWithOneTimeCode(
        oneTimeCode,
        user.id,
        user.email || profile?.email || ''
      );

      setProfile(data.profile);
      setBusiness(data.business);
      toast.success(
        `Validated! Joined "${data.business.name}" with assigned role: ${data.profile.role}. Please complete the interactive tutorial.`
      );
      navigate('/tutorial');
    } catch (error: any) {
      toast.error(error.message || 'Failed to validate staff access code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Card className="max-w-md w-full shadow-xl border border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Welcome to Xyntra<span className="text-blue-600">POS</span>
          </CardTitle>
          <CardDescription>
            Choose how you would like to set up your account access
          </CardDescription>
        </CardHeader>

        {/* Tab Toggle: Create Business vs Join Workspace */}
        <div className="px-6 mb-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('create')}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                mode === 'create'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Owner / Admin</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('join')}
              className={`flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                mode === 'join'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Staff / Cashier</span>
            </button>
          </div>
        </div>

        <CardContent>
          {mode === 'create' ? (
            /* CREATE BUSINESS FORM (FOR OWNERS) */
            <form onSubmit={handleCreateBusiness} className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                Registering a new retail business workspace. You will be set as the <strong>Admin & Owner</strong>.
              </div>

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
                Initialize Owner Workspace
              </Button>
            </form>
          ) : (
            /* ONE-TIME STAFF CODE FORM (FOR CASHIERS / MANAGERS) */
            <form onSubmit={handleJoinWithCode} className="space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <KeyRound className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                <span>
                  Enter the <strong>One-Time Staff Access Code</strong> generated for your email address (<code>{user.email}</code>) by your store owner or manager.
                </span>
              </div>

              <Input
                label="One-Time Staff Access Code *"
                type="text"
                placeholder="e.g. XYN-8K4P92"
                value={oneTimeCode}
                onChange={(e) => setOneTimeCode(e.target.value.toUpperCase())}
                disabled={isLoading}
                className="font-mono text-center tracking-wider uppercase text-base font-bold"
                required
              />

              <div className="p-3.5 bg-slate-100 dark:bg-slate-800/70 rounded-xl text-xs text-slate-600 dark:text-slate-400 space-y-1.5 border border-slate-200 dark:border-slate-700/50">
                <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                  <Lock className="w-3.5 h-3.5 text-blue-500" />
                  <span>How Role Assignment Works</span>
                </div>
                <p className="leading-relaxed">
                  Your staff role (Cashier, Manager, or Sales Representative) is securely pre-assigned by your business owner. Entering your one-time code automatically validates and applies your access level.
                </p>
              </div>

              <Button type="submit" className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white" isLoading={isLoading}>
                Validate & Activate Staff Account
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
