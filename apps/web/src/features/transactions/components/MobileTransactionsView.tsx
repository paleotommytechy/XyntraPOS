import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { transactionsApi } from '../services/transactions.api';
import type { FullTransaction, FullTransactionItem } from '../services/transactions.api';
import { paymentsApi } from '../../payments/services/payments.api';
import { Button, Dialog } from '@xyntra/ui';
import {
  Search,
  RefreshCw,
  Printer,
  ChevronRight,
  ShieldCheck,
  Zap,
  AlertTriangle,
  RotateCcw,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';

export function MobileTransactionsView() {
  const { business } = useAuthStore();
  const [transactions, setTransactions] = useState<FullTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Transaction details modal
  const [selectedTx, setSelectedTx] = useState<FullTransaction | null>(null);
  const [txItems, setTxItems] = useState<FullTransactionItem[]>([]);
  const [isDetailsLoading, setIsDetailsLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Verifying & refunding states
  const [isVerifying, setIsVerifying] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);

  // Receipt printable ref
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
      const data = await transactionsApi.getTransactions(business.id);
      setTransactions(data);
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
      toast.error('Failed to load transaction details');
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
      toast.success(`Payment verified! Reference: ${updatedPayment.provider_reference}`);

      const allTx = await transactionsApi.getTransactions(business!.id);
      setTransactions(allTx);
      const updatedTx = allTx.find((t) => t.id === selectedTx.id);
      if (updatedTx) setSelectedTx(updatedTx);
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
      await paymentsApi.simulateWebhook(paymentId, status);
      toast.success(`Webhook triggered: ${status}`);

      const allTx = await transactionsApi.getTransactions(business!.id);
      setTransactions(allTx);
      const updatedTx = allTx.find((t) => t.id === selectedTx.id);
      if (updatedTx) setSelectedTx(updatedTx);
    } catch (err: any) {
      toast.error(err.message || 'Failed to simulate webhook');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleRefundTransaction = async () => {
    if (!selectedTx) return;
    if (!confirm('Are you sure you want to refund this transaction? Inventory stock will be restored.')) return;

    setIsRefunding(true);
    try {
      await transactionsApi.refundTransaction(selectedTx.id);
      toast.success('Transaction refunded and stock restored.');

      const allTx = await transactionsApi.getTransactions(business!.id);
      setTransactions(allTx);
      const updatedTx = allTx.find((t) => t.id === selectedTx.id);
      if (updatedTx) setSelectedTx(updatedTx);
    } catch (err: any) {
      toast.error(err.message || 'Failed to process refund');
    } finally {
      setIsRefunding(false);
    }
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
        `${tx.customer.first_name} ${tx.customer.last_name}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || tx.payment_status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Success':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'Failed':
        return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border-red-200 dark:border-red-800';
      case 'Refunded':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      default:
        return 'bg-slate-50 text-slate-700 dark:bg-slate-900/40 dark:text-slate-400 border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="space-y-3">
      {/* Header & Filter Bar */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Sales Transactions
          </h1>
          <button
            onClick={loadTransactions}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search receipt # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Status Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
          {['all', 'Success', 'Pending', 'Failed', 'Refunded'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap snap-start transition-all ${
                statusFilter === st
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {st === 'all' ? 'All Transactions' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions List Cards */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <RefreshCw className="h-7 w-7 animate-spin text-blue-600 mb-2" />
          <span className="text-xs font-medium">Loading sales history...</span>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center">
          <Receipt className="h-10 w-10 mb-2 text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-semibold">No transactions found</p>
          <p className="text-xs text-slate-500 mt-0.5">Try clearing filters</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredTransactions.map((tx) => {
            const firstPayment = tx.payments && tx.payments[0];
            return (
              <div
                key={tx.id}
                onClick={() => loadTransactionDetails(tx)}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3.5 flex items-center justify-between active:scale-[0.99] transition-all shadow-sm cursor-pointer"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-xs text-slate-900 dark:text-white">
                      {tx.receipt_number}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClass(
                        tx.payment_status
                      )}`}
                    >
                      {tx.payment_status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate">
                    {tx.customer
                      ? `${tx.customer.first_name} ${tx.customer.last_name}`
                      : 'Walk-in Customer'}
                  </p>

                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                    <span>
                      {new Date(tx.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>•</span>
                    <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono font-medium">
                      {firstPayment?.provider || 'Cash'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                    ₦{tx.total.toLocaleString()}
                  </span>
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Transaction Details Modal Dialog */}
      <Dialog
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title={`Invoice ${selectedTx?.receipt_number}`}
      >
        {selectedTx && (
          <div className="space-y-4 text-xs">
            {/* Pending payment notice */}
            {selectedTx.payment_status === 'Pending' && (
              <div className="border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 space-y-2">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="font-semibold text-amber-900 dark:text-amber-300">
                    Awaiting Payment Settlement
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedTx.payments?.[0]?.provider === 'Transfer' && (
                    <Button
                      onClick={handleVerifyPayment}
                      isLoading={isVerifying}
                      className="text-xs h-8 px-3"
                    >
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      Verify Transfer
                    </Button>
                  )}

                  {selectedTx.payments?.[0]?.provider === 'Paystack' && (
                    <>
                      <Button
                        onClick={() => handleSimulateWebhook('Success')}
                        isLoading={isVerifying}
                        className="text-xs h-8 px-3 bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Zap className="h-3.5 w-3.5 mr-1" />
                        Simulate Webhook
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* General Info Grid */}
            <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border dark:border-slate-800 text-[11px]">
              <div>
                <span className="text-slate-400 block">Customer</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedTx.customer
                    ? `${selectedTx.customer.first_name} ${selectedTx.customer.last_name}`
                    : 'Walk-in Customer'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Payment Provider</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedTx.payments?.[0]?.provider || 'Cash'}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block">Reference</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200 truncate block">
                  {selectedTx.payments?.[0]?.payment_reference || 'N/A'}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white">Items Breakdown</h4>
              {isDetailsLoading ? (
                <div className="py-4 text-center text-slate-400">Loading items...</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
                  {txItems.map((item) => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">{item.product?.name}</p>
                        <p className="text-[10px] text-slate-400">Qty: {item.quantity} × ₦{item.unit_price.toLocaleString()}</p>
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">₦{item.total.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="space-y-1 pt-2 border-t dark:border-slate-800 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>₦{selectedTx.subtotal.toLocaleString()}</span>
              </div>
              {selectedTx.discount > 0 && (
                <div className="flex justify-between text-red-500">
                  <span>Discount</span>
                  <span>- ₦{selectedTx.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>+ ₦{selectedTx.tax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1">
                <span>Total Amount</span>
                <span className="text-blue-600 dark:text-blue-400">₦{selectedTx.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t dark:border-slate-800">
              <Button onClick={handlePrintReceipt} variant="secondary" className="flex-1 h-10 text-xs">
                <Printer className="h-4 w-4 mr-1" />
                Print Invoice
              </Button>
              {selectedTx.payment_status !== 'Refunded' && selectedTx.payment_status !== 'Failed' && (
                <Button
                  onClick={handleRefundTransaction}
                  isLoading={isRefunding}
                  variant="secondary"
                  className="flex-1 h-10 text-xs border-red-200 text-red-600 hover:bg-red-50"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Refund
                </Button>
              )}
            </div>

            {/* Hidden thermal print wrapper */}
            <div className="hidden">
              <div ref={receiptRef} className="text-slate-950">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold">{business?.name || 'XyntraPOS'}</h3>
                </div>
                <div className="divider"></div>
                <div className="text-[10px]">
                  <div>Receipt: {selectedTx.receipt_number}</div>
                  <div>Total: ₦{selectedTx.total.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
