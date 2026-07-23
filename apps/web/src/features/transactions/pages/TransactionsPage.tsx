import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileTransactionsView } from '../components/MobileTransactionsView';
import { transactionsApi } from '../services/transactions.api';
import { returnsApi } from '../services/returns.api';
import type { FullTransaction, FullTransactionItem } from '../services/transactions.api';
import type { ReturnRecord } from '@xyntra/types';
import { paymentsApi } from '../../payments/services/payments.api';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Card, Button, Dialog, Input } from '@xyntra/ui';
import {
  Search,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Printer,
  ChevronRight,
  ShieldCheck,
  Zap,
  AlertTriangle,
  RotateCcw,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { ReturnModal } from '../components/ReturnModal';

export function TransactionsPage() {
  const { isMobileMode } = useIsMobile();
  const { business, profile } = useAuthStore();

  if (isMobileMode) {
    return <MobileTransactionsView />;
  }

  const [transactions, setTransactions] = useState<FullTransaction[]>([]);
  const [returnsList, setReturnsList] = useState<ReturnRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'sales' | 'returns'>('sales');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [providerFilter, setProviderFilter] = useState('all');
  const [datePreset, setDatePreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Selected Transaction Drawer / Modal
  const [selectedTx, setSelectedTx] = useState<FullTransaction | null>(null);
  const [txItems, setTxItems] = useState<FullTransactionItem[]>([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Return Modal state
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);

  // Verification & Webhook Simulation loading states
  const [isVerifying, setIsVerifying] = useState(false);

  // Receipt reference for printing
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (business?.id) {
      loadTransactions();
    }
  }, [business?.id]);

  const loadTransactions = async () => {
    if (!business?.id) return;
    setIsLoading(true);
    try {
      const [txData, retData] = await Promise.all([
        transactionsApi.getTransactions(business.id),
        returnsApi.getReturns(business.id),
      ]);
      setTransactions(txData);
      setReturnsList(retData);
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactionDetails = async (tx: FullTransaction) => {
    setSelectedTx(tx);
    setIsDetailsLoading(true);
    setIsDetailOpen(true);
    try {
      const items = await transactionsApi.getTransactionItems(tx.id);
      setTxItems(items);
    } catch (err) {
      toast.error('Failed to load transaction items');
    } finally {
      setIsDetailsLoading(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedTx || !selectedTx.payments || selectedTx.payments.length === 0) return;
    setIsVerifying(true);
    try {
      const paymentId = selectedTx.payments[0].id;
      const updatedPayment = await paymentsApi.verifyPayment(paymentId);
      
      toast.success(`Payment verified successfully! Reference: ${updatedPayment.provider_reference}`);
      loadTransactions();
    } catch (err: any) {
      toast.error(err.message || 'Payment verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSimulateWebhook = async (status: 'Success' | 'Failed') => {
    if (!selectedTx || !selectedTx.payments || selectedTx.payments.length === 0) return;
    setIsVerifying(true);
    try {
      const paymentId = selectedTx.payments[0].id;
      const updatedPayment = await paymentsApi.simulateWebhook(paymentId, status);
      
      toast.success(`Webhook received! Status: ${status}. Reference: ${updatedPayment.provider_reference}`);
      loadTransactions();
    } catch (err: any) {
      toast.error(err.message || 'Failed to simulate webhook');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleProcessReturnSubmit = async (data: {
    transaction_id: string;
    customer_id?: string;
    refund_amount: number;
    refund_method: 'Store Credit' | 'Cash' | 'Card' | 'Bank Transfer';
    reason: string;
    restock_inventory: boolean;
    items: {
      product_id: string;
      product_name: string;
      quantity: number;
      unit_price: number;
    }[];
  }) => {
    if (!business?.id) return;
    await returnsApi.processReturn({
      ...data,
      business_id: business.id,
      processed_by: profile?.id,
    });
    toast.success('Sale refund and return processed successfully!');
    setIsDetailOpen(false);
    loadTransactions();
  };

  const handlePrintReceipt = () => {
    const printContent = receiptRef.current?.innerHTML;
    const windowName = `PrintWindow_${Date.now()}`;
    const printWindow = window.open('about:blank', windowName, 'left=5000,top=5000,width=0,height=0');
    
    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Receipt</title>
            <style>
              body { font-family: monospace; padding: 20px; font-size: 12px; line-height: 1.4; color: #000; width: 80mm; margin: 0 auto; }
              .text-center { text-align: center; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
              table { width: 100%; border-collapse: collapse; }
              th { text-align: left; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    const matchesSearch =
      tx.receipt_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (tx.customer &&
        (`${tx.customer.first_name} ${tx.customer.last_name}`)
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || tx.payment_status.toLowerCase() === statusFilter.toLowerCase();
    const firstPayment = tx.payments && tx.payments[0];
    const matchesProvider =
      providerFilter === 'all' ||
      (firstPayment && firstPayment.provider.toLowerCase() === providerFilter.toLowerCase());

    let matchesDate = true;
    const txDate = new Date(tx.created_at);
    const today = new Date();
    
    if (datePreset === 'today') {
      matchesDate = txDate.toDateString() === today.toDateString();
    } else if (datePreset === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      matchesDate = txDate.toDateString() === yesterday.toDateString();
    } else if (datePreset === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(today.getDate() - 7);
      matchesDate = txDate >= oneWeekAgo;
    } else if (datePreset === 'custom') {
      if (customStartDate) {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && txDate >= start;
      }
      if (customEndDate) {
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && txDate <= end;
      }
    }

    return matchesSearch && matchesStatus && matchesProvider && matchesDate;
  });

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.info('No transactions to export');
      return;
    }

    const headers = ['Receipt Number', 'Date', 'Customer', 'Cashier', 'Subtotal', 'Discount', 'Tax', 'Total', 'Payment Status', 'Provider', 'Reference'];
    const rows = filteredTransactions.map((tx) => [
      tx.receipt_number,
      new Date(tx.created_at).toLocaleString(),
      tx.customer ? `${tx.customer.first_name} ${tx.customer.last_name}` : 'Walk-in',
      tx.cashier?.name || 'N/A',
      tx.subtotal,
      tx.discount,
      tx.tax,
      tx.total,
      tx.payment_status,
      tx.payments && tx.payments[0] ? tx.payments[0].provider : 'N/A',
      tx.payments && tx.payments[0] ? tx.payments[0].payment_reference : 'N/A',
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((val) => `"${val}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transactions_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Transactions exported to CSV!');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Success':
        return 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'Pending':
        return 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'Failed':
        return 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'Refunded':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-900/20 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Transactions & Refunds</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track sales invoices, payment verifications, and process customer refunds.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadTransactions} variant="secondary" className="h-10">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportCSV} className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('sales')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${
            activeTab === 'sales'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Sales History ({transactions.length})
        </button>
        <button
          onClick={() => setActiveTab('returns')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${
            activeTab === 'returns'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Refunds & Returns ({returnsList.length})
        </button>
      </div>

      {activeTab === 'sales' && (
        <>
          {/* Filtering Toolbar Card */}
          <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border dark:border-slate-800">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receipt, customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="Success">Success</option>
                  <option value="Pending">Pending</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={providerFilter}
                  onChange={(e) => setProviderFilter(e.target.value)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="all">All Payment Providers</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Transfer">Bank Transfer</option>
                  <option value="Paystack">Paystack</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={datePreset}
                  onChange={(e) => setDatePreset(e.target.value as any)}
                  className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="all">All Dates</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>
            </div>

            {datePreset === 'custom' && (
              <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
                <Input
                  label="Start Date"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                />
                <Input
                  label="End Date"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                />
              </div>
            )}
          </Card>

          {/* Transactions Data Table */}
          <Card className="overflow-hidden shadow-sm bg-white dark:bg-slate-900 border dark:border-slate-800">
            {isLoading ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                Loading transactions catalog...
              </div>
            ) : filteredTransactions.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                No transactions found matching filter parameters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt Number</TableHead>
                    <TableHead>Date / Time</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Sold By (Cashier)</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((tx) => {
                    const firstPayment = tx.payments && tx.payments[0];
                    return (
                      <TableRow key={tx.id} className="cursor-pointer" onClick={() => loadTransactionDetails(tx)}>
                        <TableCell className="font-mono font-bold text-slate-900 dark:text-white">
                          {tx.receipt_number}
                        </TableCell>
                        <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                        <TableCell>{tx.customer ? `${tx.customer.first_name} ${tx.customer.last_name}` : 'Walk-in Customer'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                            <User className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            <span>{tx.cashier?.name || 'Store Cashier'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="flex items-center gap-1.5 mt-2">
                          <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-medium">
                            {firstPayment ? firstPayment.provider : 'Unknown'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(tx.payment_status)}`}>
                            {tx.payment_status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900 dark:text-white">
                          ₦{tx.total.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}

      {/* Tab: Returns */}
      {activeTab === 'returns' && (
        <Card className="overflow-hidden shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {returnsList.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <RotateCcw className="h-8 w-8 mx-auto mb-2" />
              No processed sales returns recorded yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Return Date</TableHead>
                  <TableHead>Refund Method</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead className="text-center">Restocked Stock?</TableHead>
                  <TableHead className="text-right">Refund Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {returnsList.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-xs">{new Date(r.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        {r.refund_method}
                      </span>
                    </TableCell>
                    <TableCell>{r.customer ? `${r.customer.first_name} ${r.customer.last_name}` : 'Walk-in'}</TableCell>
                    <TableCell className="text-xs text-slate-500 italic max-w-xs truncate">{r.reason}</TableCell>
                    <TableCell className="text-center font-bold text-xs">
                      {r.restock_inventory ? 'Yes (+Stock)' : 'No'}
                    </TableCell>
                    <TableCell className="text-right font-bold text-purple-600 dark:text-purple-400">
                      ₦{r.refund_amount.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Return Modal */}
      <ReturnModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        transaction={selectedTx}
        currency={business?.currency || 'NGN'}
        onProcessReturn={handleProcessReturnSubmit}
      />

      {/* Transaction Details Modal Dialog */}
      <Dialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Transaction Details: ${selectedTx?.receipt_number}`}
        className="max-w-2xl"
      >
        {selectedTx && (
          <div className="space-y-6">
            {selectedTx.payment_status === 'Pending' && (
              <div className="border border-yellow-250 dark:border-yellow-900 bg-yellow-50/70 dark:bg-yellow-950/20 rounded-xl p-4 space-y-3">
                <div className="flex gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
                  <div>
                    <h4 className="font-bold text-sm text-yellow-800 dark:text-yellow-400">Payment Verification Required</h4>
                    <p className="text-xs text-yellow-750 dark:text-yellow-500 mt-0.5">
                      This transaction is marked as pending. Cashier needs to verify funds clearance.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5 pt-1">
                  {selectedTx.payments?.[0]?.provider === 'Transfer' && (
                    <Button
                      onClick={handleVerifyPayment}
                      isLoading={isVerifying}
                      className="bg-blue-650 hover:bg-blue-700 text-white text-xs h-9 flex items-center gap-1.5"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Verify Transfer Settled
                    </Button>
                  )}

                  {selectedTx.payments?.[0]?.provider === 'Paystack' && (
                    <>
                      <Button
                        onClick={() => handleSimulateWebhook('Success')}
                        isLoading={isVerifying}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 flex items-center gap-1.5"
                      >
                        <Zap className="h-3.5 w-3.5" />
                        Simulate Success Webhook
                      </Button>
                      <Button
                        onClick={() => handleSimulateWebhook('Failed')}
                        isLoading={isVerifying}
                        variant="secondary"
                        className="text-xs text-red-600 hover:bg-red-50 h-9"
                      >
                        Simulate Fail Webhook
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Payment Provider</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedTx.payments?.[0]?.provider || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Reference Number</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5 block truncate">
                  {selectedTx.payments?.[0]?.payment_reference || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Cashier</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedTx.cashier?.name || 'Administrator'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Customer</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                  {selectedTx.customer ? `${selectedTx.customer.first_name} ${selectedTx.customer.last_name}` : 'Walk-in'}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Transaction Line Items</h4>
              {isDetailsLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  <RefreshCw className="h-4 w-4 animate-spin mx-auto mb-1 text-blue-600" />
                  Loading items list...
                </div>
              ) : (
                <div className="border dark:border-slate-800 rounded-lg overflow-hidden">
                  <Table className="bg-transparent">
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-900/30">
                      <TableRow>
                        <TableHead className="h-8 py-1.5 text-[11px]">Product Name</TableHead>
                        <TableHead className="h-8 py-1.5 text-[11px] text-center">Qty</TableHead>
                        <TableHead className="h-8 py-1.5 text-[11px] text-right">Unit Price</TableHead>
                        <TableHead className="h-8 py-1.5 text-[11px] text-right">Total Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {txItems.map((item) => (
                        <TableRow key={item.id} className="h-10 hover:bg-transparent">
                          <TableCell className="py-2">
                            <div className="font-medium text-slate-900 dark:text-white text-xs">{item.product?.name || 'Unknown Product'}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.product?.sku}</div>
                          </TableCell>
                          <TableCell className="py-2 text-center text-xs">{item.quantity}</TableCell>
                          <TableCell className="py-2 text-right text-xs">₦{item.unit_price.toLocaleString()}</TableCell>
                          <TableCell className="py-2 text-right font-semibold text-xs">₦{item.total.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-t dark:border-slate-800 pt-4">
              <div className="flex gap-2">
                <Button onClick={handlePrintReceipt} variant="secondary" className="h-10">
                  <Printer className="h-4 w-4 mr-2" />
                  Print Invoice
                </Button>
                {selectedTx.payment_status !== 'Refunded' && selectedTx.payment_status !== 'Failed' && (
                  <Button
                    onClick={() => setIsReturnModalOpen(true)}
                    variant="secondary"
                    className="h-10 border-purple-200 text-purple-700 hover:bg-purple-50 dark:border-purple-900/30 dark:text-purple-300"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Process Refund & Return
                  </Button>
                )}
              </div>

              <div className="w-full sm:w-64 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₦{selectedTx.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-red-500">
                  <span>Discount</span>
                  <span>- ₦{selectedTx.discount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>+ ₦{selectedTx.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1.5 border-t dark:border-slate-800">
                  <span>Grand Total</span>
                  <span className="text-blue-600 dark:text-blue-400">₦{selectedTx.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Printable Receipt template */}
            <div className="hidden">
              <div ref={receiptRef} className="text-slate-950">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider">{business?.name || 'XyntraPOS Shop'}</h3>
                  <p className="text-[10px] text-slate-500">{business?.address || 'Lagos, Nigeria'}</p>
                  <p className="text-[10px] text-slate-500">Phone: {business?.phone || 'N/A'}</p>
                </div>
                <div className="divider"></div>
                <div className="text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span>Receipt No:</span>
                    <span className="font-bold">{selectedTx.receipt_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(selectedTx.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{selectedTx.cashier?.name || 'Admin'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{selectedTx.customer ? `${selectedTx.customer.first_name} ${selectedTx.customer.last_name}` : 'Walk-in'}</span>
                  </div>
                </div>
                <div className="divider"></div>
                <table className="w-full text-[10px]">
                  <thead>
                    <tr style={{ borderBottom: '1px dashed #000' }}>
                      <th style={{ paddingBottom: '4px' }}>Item</th>
                      <th style={{ paddingBottom: '4px', textAlign: 'center' }}>Qty</th>
                      <th style={{ paddingBottom: '4px', textAlign: 'right' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {txItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ padding: '2px 0' }}>{item.product?.name}</td>
                        <td style={{ padding: '2px 0', textAlign: 'center' }}>{item.quantity}</td>
                        <td style={{ padding: '2px 0', textAlign: 'right' }}>₦{(item.unit_price * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="divider"></div>
                <div className="text-[10px] space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₦{selectedTx.subtotal.toLocaleString()}</span>
                  </div>
                  {selectedTx.discount > 0 && (
                    <div className="flex justify-between" style={{ color: 'red' }}>
                      <span>Discount:</span>
                      <span>- ₦{selectedTx.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>+ ₦{selectedTx.tax.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold" style={{ fontSize: '11px', paddingTop: '4px' }}>
                    <span>Grand Total:</span>
                    <span>₦{selectedTx.total.toLocaleString()}</span>
                  </div>
                </div>
                <div className="divider"></div>
                <div className="text-center font-bold" style={{ fontSize: '9px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Thank you for shopping with us!
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
export default TransactionsPage;
