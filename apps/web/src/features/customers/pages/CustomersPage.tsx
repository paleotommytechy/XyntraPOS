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
} from 'lucide-react';
import { toast } from 'sonner';

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
  
  // Data states
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Dialog states
  const [isCustomerOpen, setIsCustomerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
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
    } else {
      setFirstName('');
      setLastName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setNotes('');
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
      const payload: CreateCustomerInput = {
        business_id: business.id,
        first_name: firstName,
        last_name: lastName,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
        notes: notes || undefined,
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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
      await customersApi.deleteCustomer(id);
      toast.success('Customer deleted successfully');
      loadCustomers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete customer');
    }
  };

  // Open history view
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
      console.error(err);
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
      (c.email && c.email.toLowerCase().includes(search))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Customer Database</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Maintain merchant contacts, tag customer notes, and review sales order histories.
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
              placeholder="Search Name, Phone, Email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
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
                  <TableHead>Email Address</TableHead>
                  <TableHead>Store Address</TableHead>
                  <TableHead>Client Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                        {c.first_name[0]}{c.last_name[0]}
                      </div>
                      <span>
                        {c.first_name} {c.last_name}
                      </span>
                    </TableCell>
                    <TableCell>{c.phone || <span className="text-slate-400">-</span>}</TableCell>
                    <TableCell>{c.email || <span className="text-slate-400">-</span>}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {c.address || <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {c.notes || <span className="text-slate-400">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenHistory(c)}
                          className="p-1.5 rounded-md hover:bg-blue-50 dark:hover:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                          title="Purchase History"
                        >
                          <History className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenCustomer(c)}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Customer Form Overlay Dialog */}
      <Dialog
        isOpen={isCustomerOpen}
        onClose={() => setIsCustomerOpen(false)}
        title={editingCustomer ? 'Edit Customer Info' : 'Register Customer'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name *"
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={isSubmitting}
              required
            />
            <Input
              label="Last Name *"
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>

          <Input
            label="Phone Number"
            type="tel"
            placeholder="+234..."
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={isSubmitting}
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="john.doe@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSubmitting}
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Address</label>
            <textarea
              placeholder="Residential or business location..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={isSubmitting}
              rows={2}
              className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Notes / Preferences</label>
            <textarea
              placeholder="Client tags, sizing preferences, payment records, etc..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              rows={2}
              className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
    </div>
  );
}
export default CustomersPage;
