import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileDesktopRedirect } from '../../../components/mobile/MobileDesktopRedirect';
import { customersApi } from '../services/customers.api';
import type { CreateCustomerInput } from '../services/customers.api';
import { supabase } from '../../../lib/supabase';
import type { Customer } from '@xyntra/types';
import {
  Button,
  Input,
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dialog,
  ConfirmModal,
} from '@xyntra/ui';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  History,
  FileText,
  Award,
  Wallet,
  BarChart2,
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomerAnalyticsModal } from '../components/CustomerAnalyticsModal';

export function CustomersPage() {
  const { isMobileMode } = useIsMobile();
  const { business } = useAuthStore();

  if (isMobileMode) {
    return (
      <MobileDesktopRedirect
        featureName="Customer Database Management"
        description="Customer lookup and quick customer creation are built directly into the Mobile POS Console. For full customer editing and CRM management, please switch to the desktop interface."
      />
    );
  }
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Dialog states
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [selectedCustomerForAnalytics, setSelectedCustomerForAnalytics] = useState<Customer | null>(null);
  const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState<Customer | null>(null);
  const [customerSalesHistory, setCustomerSalesHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);
  const [storeCredit, setStoreCredit] = useState(0);
  const [tagsInput, setTagsInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (business?.id) {
      loadCustomers();
    }
  }, [business?.id]);

  const loadCustomers = async () => {
    if (!business?.id) return;
    setIsLoading(true);
    try {
      const data = await customersApi.getCustomers(business.id);
      setCustomers(data);
    } catch (err: any) {
      toast.error('Failed to load customers list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCustomer = (customer: Customer | null = null) => {
    setEditingCustomer(customer);
    if (customer) {
      setFirstName(customer.first_name);
      setLastName(customer.last_name);
      setPhone(customer.phone || '');
      setEmail(customer.email || '');
      setAddress(customer.address || '');
      setNotes(customer.notes || '');
      setLoyaltyPoints(customer.loyalty_points || 0);
      setStoreCredit(customer.store_credit || 0);
      setTagsInput((customer.tags || []).join(', '));
    } else {
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
      setLoyaltyPoints(0);
      setStoreCredit(0);
      setTagsInput('');
    }
    setIsCustomerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    if (!firstName.trim() || !lastName.trim()) {
      toast.error('First and Last name are required');
      return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload: CreateCustomerInput = {
        business_id: business.id,
        first_name: firstName,
        last_name: lastName,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        notes: notes || undefined,
        loyalty_points: loyaltyPoints,
        store_credit: storeCredit,
        tags: tagsArray,
      };

      if (editingCustomer) {
        await customersApi.updateCustomer(editingCustomer.id, payload);
        toast.success('Customer updated successfully');
      } else {
        await customersApi.createCustomer(payload);
        toast.success('Customer registered successfully');
      }
      setIsCustomerOpen(false);
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDeleteCustomer = async () => {
    if (!deleteConfirmId) return;
    try {
      await customersApi.deleteCustomer(deleteConfirmId);
      toast.success('Customer deleted successfully');
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete customer');
    }
  };

  const handleOpenHistory = async (customer: Customer) => {
    setSelectedCustomerForHistory(customer);
    setCustomerSalesHistory([]);
    setIsHistoryOpen(true);
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCustomerSalesHistory(data || []);
    } catch (err) {
      toast.error('Failed to retrieve customer transactions');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase();
    const search = searchQuery.toLowerCase();
    return (
      fullName.includes(search) ||
      (c.phone && c.phone.includes(search)) ||
      (c.email && c.email.toLowerCase().includes(search)) ||
      (c.tags && c.tags.some((t) => t.toLowerCase().includes(search)))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Customer Database & Loyalty</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage customer accounts, loyalty reward points, store credit, and tags.
          </p>
        </div>
        <div>
          <Button onClick={() => handleOpenCustomer(null)}>
            <Plus className="h-4 w-4 mr-2" />
            Register Customer
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search Name, Phone, Tag, Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
            />
          </div>

          {filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-slate-400">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <span>No registered customers found matching query.</span>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone Number</TableHead>
                  <TableHead>Loyalty Pts</TableHead>
                  <TableHead>Store Credit</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold shrink-0">
                        {c.first_name[0]}{c.last_name[0]}
                      </div>
                      <div>
                        <div className="text-slate-900 dark:text-white">{c.first_name} {c.last_name}</div>
                        <div className="text-[10px] text-slate-400">{c.email || 'No Email'}</div>
                      </div>
                    </TableCell>
                    <TableCell>{c.phone || <span className="text-slate-400">-</span>}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                        <Award className="h-3 w-3" />
                        {c.loyalty_points || 0} Pts
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        <Wallet className="h-3 w-3" />
                        ₦{(c.store_credit || 0).toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {c.tags && c.tags.length > 0 ? (
                          c.tags.map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {t}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-400 text-xs">-</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCustomerForAnalytics(c);
                            setIsAnalyticsOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-950/20 text-purple-600 dark:text-purple-400"
                          title="Customer Analytics"
                        >
                          <BarChart2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenHistory(c)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                          title="Purchase History"
                        >
                          <History className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleOpenCustomer(c)}
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Customer Analytics Modal */}
      <CustomerAnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        customer={selectedCustomerForAnalytics}
        currency={business?.currency || 'NGN'}
      />

      {/* Customer Form Overlay Dialog */}
      <Dialog
        isOpen={isCustomerOpen}
        onClose={() => setIsCustomerOpen(false)}
        title={editingCustomer ? 'Edit Customer Profile' : 'Register Customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name *"
              type="text"
              placeholder="Joy"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <Input
              label="Last Name *"
              type="text"
              placeholder="Obi"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Phone Number"
              type="tel"
              placeholder="080..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
            />
            <Input
              label="Email Address"
              type="email"
              placeholder="joy.obi@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Loyalty Points Balance"
              type="number"
              value={loyaltyPoints}
              onChange={(e) => setLoyaltyPoints(Number(e.target.value))}
              disabled={isSubmitting}
            />
            <Input
              label="Store Credit Balance (₦)"
              type="number"
              value={storeCredit}
              onChange={(e) => setStoreCredit(Number(e.target.value))}
              disabled={isSubmitting}
            />
          </div>

          <Input
            label="Customer Tags (comma separated)"
            type="text"
            placeholder="VIP, Wholesale, Regular, Corporate"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            disabled={isSubmitting}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes / Preferences</label>
            <textarea
              placeholder="Client tags, sizing preferences, payment records, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              rows={2}
              className="flex w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCustomerOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editingCustomer ? 'Save Details' : 'Register'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Purchase History Overlay Dialog */}
      <Dialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        title={`Purchase History: ${selectedCustomerForHistory?.first_name} ${selectedCustomerForHistory?.last_name}`}
        className="max-w-2xl"
      >
        {isLoadingHistory ? (
          <div className="h-48 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : customerSalesHistory.length === 0 ? (
          <div className="text-center p-12 text-slate-400">
            <FileText className="h-8 w-8 mx-auto mb-2 text-slate-300" />
            <p className="text-sm">No transaction records found for this customer.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt #</TableHead>
                <TableHead>Date / Time</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customerSalesHistory.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-mono text-xs">{h.receipt_number}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(h.created_at).toLocaleDateString()} at{' '}
                    {new Date(h.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </TableCell>
                  <TableCell className="font-bold">₦{h.total.toLocaleString()}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        h.payment_status === 'Success'
                          ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                          : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/20 dark:text-yellow-400'
                      }`}
                    >
                      {h.payment_status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        h.transaction_status === 'Completed'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
                          : 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400'
                      }`}
                    >
                      {h.transaction_status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Dialog>

      {/* Delete Customer Confirm Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={confirmDeleteCustomer}
        title="Delete Customer"
        message="Are you sure you want to delete this customer?"
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
export default CustomersPage;
