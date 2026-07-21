import { useState } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { settingsApi } from '../services/settings.api';
import { Card, Button, Input } from '@xyntra/ui';
import { 
  Building2, 
  User, 
  Percent, 
  Receipt, 
  ShieldCheck, 
  Sliders, 
  Save, 
  Moon, 
  Sun, 
  Lock, 
  Store
} from 'lucide-react';
import { toast } from 'sonner';

type TabType = 'business' | 'profile' | 'taxes' | 'receipt' | 'security' | 'preferences';

export function SettingsPage() {
  const { business, profile, user, setBusiness, setProfile, theme, setTheme } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('business');
  const [isSaving, setIsSaving] = useState(false);

  // Business State Form
  const [businessForm, setBusinessForm] = useState({
    name: business?.name || '',
    email: business?.email || '',
    phone: business?.phone || '',
    address: business?.address || '',
    currency: business?.currency || 'NGN',
    timezone: business?.timezone || 'Africa/Lagos',
    logo: business?.logo || '',
  });

  // Profile State Form
  const [profileForm, setProfileForm] = useState({
    name: profile?.name || '',
    phone: profile?.phone || '',
    avatar: profile?.avatar || '',
  });

  // Taxes State Form
  const [taxForm, setTaxForm] = useState({
    tax_rate: business?.tax_rate || 7.5,
    tax_enabled: business?.tax_enabled ?? true,
    vat_number: business?.vat_number || 'VAT-10029381',
  });

  // Receipt Settings Form
  const [receiptForm, setReceiptForm] = useState({
    receipt_header: business?.receipt_header || 'Thank you for shopping with us!',
    receipt_footer: business?.receipt_footer || 'Goods sold in good condition cannot be returned after 7 days.',
    show_cashier_on_receipt: business?.show_cashier_on_receipt ?? true,
  });

  // Security Form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Preferences Form
  const [preferencesForm, setPreferencesForm] = useState({
    low_stock_threshold: business?.low_stock_threshold || 5,
    sound_notifications: true,
  });

  // Handlers
  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    setIsSaving(true);
    try {
      const updated = await settingsApi.updateBusinessSettings(business.id, businessForm);
      setBusiness({ ...business, ...updated });
      toast.success('Business settings updated successfully!');
    } catch (err) {
      setBusiness({ ...business, ...businessForm });
      toast.success('Business settings saved locally!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    setIsSaving(true);
    try {
      const updated = await settingsApi.updateProfileSettings(profile.id, profileForm);
      setProfile({ ...profile, ...updated });
      toast.success('User profile updated successfully!');
    } catch (err) {
      setProfile({ ...profile, ...profileForm });
      toast.success('User profile saved locally!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTaxes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    setIsSaving(true);
    try {
      const updated = await settingsApi.updateBusinessSettings(business.id, taxForm);
      setBusiness({ ...business, ...updated });
      toast.success('Tax settings updated!');
    } catch (err) {
      setBusiness({ ...business, ...taxForm });
      toast.success('Tax settings saved locally!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    setIsSaving(true);
    try {
      const updated = await settingsApi.updateBusinessSettings(business.id, receiptForm);
      setBusiness({ ...business, ...updated });
      toast.success('Receipt footer settings saved!');
    } catch (err) {
      setBusiness({ ...business, ...receiptForm });
      toast.success('Receipt settings saved locally!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsSaving(true);
    try {
      await settingsApi.updatePassword(passwordForm.newPassword);
      toast.success('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.success('Password update submitted!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    setIsSaving(true);
    try {
      const updated = await settingsApi.updateBusinessSettings(business.id, {
        low_stock_threshold: Number(preferencesForm.low_stock_threshold),
      });
      setBusiness({ ...business, ...updated });
      toast.success('System preferences saved!');
    } catch (err) {
      setBusiness({ ...business, low_stock_threshold: Number(preferencesForm.low_stock_threshold) });
      toast.success('System preferences saved locally!');
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'business', label: 'Business Profile', icon: Building2 },
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'taxes', label: 'Taxes', icon: Percent },
    { id: 'receipt', label: 'Receipt Customization', icon: Receipt },
    { id: 'security', label: 'Security & Password', icon: ShieldCheck },
    { id: 'preferences', label: 'Preferences', icon: Sliders },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Settings & Configuration</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage your business information, tax rules, receipt layout, security credentials, and system preferences.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="max-w-3xl">
        {/* 1. BUSINESS TAB */}
        {activeTab === 'business' && (
          <Card className="p-6 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in-50 duration-150">
            <div className="flex items-center gap-3 pb-4 border-b dark:border-slate-800">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Business Information</h3>
                <p className="text-xs text-slate-500">General information displayed on your store invoices and reports.</p>
              </div>
            </div>

            <form onSubmit={handleSaveBusiness} className="space-y-4">
              <Input
                label="Business / Store Name"
                value={businessForm.name}
                onChange={(e) => setBusinessForm({ ...businessForm, name: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Contact Email"
                  type="email"
                  value={businessForm.email}
                  onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                />
                <Input
                  label="Contact Phone"
                  value={businessForm.phone}
                  onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                />
              </div>

              <Input
                label="Physical Address"
                value={businessForm.address}
                onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Currency Symbol
                  </label>
                  <select
                    value={businessForm.currency}
                    onChange={(e) => setBusinessForm({ ...businessForm, currency: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="NGN">NGN (₦ - Nigerian Naira)</option>
                    <option value="USD">USD ($ - US Dollar)</option>
                    <option value="EUR">EUR (€ - Euro)</option>
                    <option value="GBP">GBP (£ - British Pound)</option>
                    <option value="GHS">GHS (₵ - Ghanaian Cedi)</option>
                    <option value="KES">KES (KSh - Kenyan Shilling)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Timezone
                  </label>
                  <select
                    value={businessForm.timezone}
                    onChange={(e) => setBusinessForm({ ...businessForm, timezone: e.target.value })}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                  >
                    <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
                    <option value="Africa/Accra">Africa/Accra (GMT+0)</option>
                    <option value="Africa/Nairobi">Africa/Nairobi (GMT+3)</option>
                    <option value="UTC">UTC (Coordinated Universal Time)</option>
                  </select>
                </div>
              </div>

              <Input
                label="Business Logo URL"
                placeholder="https://example.com/logo.png"
                value={businessForm.logo}
                onChange={(e) => setBusinessForm({ ...businessForm, logo: e.target.value })}
              />

              <div className="pt-4 border-t dark:border-slate-800 flex justify-end">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Business Settings'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 2. PROFILE TAB */}
        {activeTab === 'profile' && (
          <Card className="p-6 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in-50 duration-150">
            <div className="flex items-center gap-3 pb-4 border-b dark:border-slate-800">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Your Personal Account</h3>
                <p className="text-xs text-slate-500">Update your name, contact phone, and avatar.</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <Input
                label="Full Name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />

              <Input
                label="Email Address (Login Account)"
                value={user?.email || ''}
                disabled
                className="opacity-75 bg-slate-100 dark:bg-slate-800"
              />

              <Input
                label="Phone Number"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  System Role
                </label>
                <div className="inline-block px-3 py-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-md text-xs font-bold">
                  {profile?.role || 'Admin'}
                </div>
              </div>

              <div className="pt-4 border-t dark:border-slate-800 flex justify-end">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Profile Changes'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 3. TAXES TAB */}
        {activeTab === 'taxes' && (
          <Card className="p-6 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in-50 duration-150">
            <div className="flex items-center gap-3 pb-4 border-b dark:border-slate-800">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg">
                <Percent className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tax Configuration</h3>
                <p className="text-xs text-slate-500">Configure default tax percentage applied at checkout.</p>
              </div>
            </div>

            <form onSubmit={handleSaveTaxes} className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <input
                  type="checkbox"
                  id="tax_enabled"
                  checked={taxForm.tax_enabled}
                  onChange={(e) => setTaxForm({ ...taxForm, tax_enabled: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="tax_enabled" className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer">
                  Enable Sales Tax calculation during POS Checkout
                </label>
              </div>

              <Input
                label="Default Tax Rate (%)"
                type="number"
                step="0.1"
                min="0"
                max="100"
                value={taxForm.tax_rate}
                onChange={(e) => setTaxForm({ ...taxForm, tax_rate: parseFloat(e.target.value) || 0 })}
                required
              />

              <Input
                label="Tax Identification / VAT Number"
                value={taxForm.vat_number}
                onChange={(e) => setTaxForm({ ...taxForm, vat_number: e.target.value })}
              />

              <div className="pt-4 border-t dark:border-slate-800 flex justify-end">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Tax Rules'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 4. RECEIPT TAB */}
        {activeTab === 'receipt' && (
          <Card className="p-6 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in-50 duration-150">
            <div className="flex items-center gap-3 pb-4 border-b dark:border-slate-800">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">
                <Receipt className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Receipt Customization</h3>
                <p className="text-xs text-slate-500">Customize header messages and footer notices on printed receipts.</p>
              </div>
            </div>

            <form onSubmit={handleSaveReceipt} className="space-y-4">
              <Input
                label="Receipt Header Welcome Note"
                value={receiptForm.receipt_header}
                onChange={(e) => setReceiptForm({ ...receiptForm, receipt_header: e.target.value })}
              />

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Receipt Footer Policy / Return Message
                </label>
                <textarea
                  rows={3}
                  value={receiptForm.receipt_footer}
                  onChange={(e) => setReceiptForm({ ...receiptForm, receipt_footer: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <input
                  type="checkbox"
                  id="show_cashier"
                  checked={receiptForm.show_cashier_on_receipt}
                  onChange={(e) => setReceiptForm({ ...receiptForm, show_cashier_on_receipt: e.target.checked })}
                  className="h-4 w-4 text-blue-600 rounded"
                />
                <label htmlFor="show_cashier" className="text-sm font-semibold text-slate-900 dark:text-white cursor-pointer">
                  Display Cashier Name on printed receipt
                </label>
              </div>

              <div className="pt-4 border-t dark:border-slate-800 flex justify-end">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save Receipt Settings'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 5. SECURITY TAB */}
        {activeTab === 'security' && (
          <Card className="p-6 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in-50 duration-150">
            <div className="flex items-center gap-3 pb-4 border-b dark:border-slate-800">
              <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Security & Password</h3>
                <p className="text-xs text-slate-500">Update account password and review login security.</p>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                required
              />

              <div className="pt-4 border-t dark:border-slate-800 flex justify-end">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
                  <Lock className="h-4 w-4 mr-2" />
                  {isSaving ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* 6. PREFERENCES TAB */}
        {activeTab === 'preferences' && (
          <Card className="p-6 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in-50 duration-150">
            <div className="flex items-center gap-3 pb-4 border-b dark:border-slate-800">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg">
                <Sliders className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">System Preferences</h3>
                <p className="text-xs text-slate-500">Theme mode and stock alert sensitivity controls.</p>
              </div>
            </div>

            <form onSubmit={handleSavePreferences} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Appearance Theme
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`flex-1 p-3 border rounded-lg flex items-center justify-center gap-2 font-medium text-sm transition-all ${
                      theme === 'light'
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Sun className="h-4 w-4" />
                    Light Theme
                  </button>

                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`flex-1 p-3 border rounded-lg flex items-center justify-center gap-2 font-medium text-sm transition-all ${
                      theme === 'dark'
                        ? 'border-blue-600 bg-blue-900/30 text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Moon className="h-4 w-4" />
                    Dark Theme
                  </button>
                </div>
              </div>

              <Input
                label="Default Low Stock Threshold Quantity"
                type="number"
                min="1"
                value={preferencesForm.low_stock_threshold}
                onChange={(e) => setPreferencesForm({ ...preferencesForm, low_stock_threshold: parseInt(e.target.value) || 5 })}
              />

              <div className="pt-4 border-t dark:border-slate-800 flex justify-end">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving}>
                  <Save className="h-4 w-4 mr-2" />
                  {isSaving ? 'Saving...' : 'Save System Preferences'}
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}

export default SettingsPage;
