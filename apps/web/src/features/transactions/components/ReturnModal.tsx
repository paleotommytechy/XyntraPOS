import { useState } from 'react';
import { X, RotateCcw, CheckCircle2 } from 'lucide-react';
import type { Transaction } from '@xyntra/types';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  currency: string;
  onProcessReturn: (data: {
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
  }) => Promise<void>;
}

export function ReturnModal({
  isOpen,
  onClose,
  transaction,
  currency,
  onProcessReturn,
}: ReturnModalProps) {
  const [reason, setReason] = useState('Customer returned item / Change of mind');
  const [refundMethod, setRefundMethod] = useState<'Store Credit' | 'Cash' | 'Card' | 'Bank Transfer'>('Cash');
  const [restockInventory, setRestockInventory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !transaction) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setErrorMsg('Please enter a reason for the return.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const returnedItems = (transaction.items || []).map((item) => ({
        product_id: item.product_id,
        product_name: item.product?.name || 'Product',
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      await onProcessReturn({
        transaction_id: transaction.id,
        customer_id: transaction.customer_id,
        refund_amount: transaction.total,
        refund_method: refundMethod,
        reason,
        restock_inventory: restockInventory,
        items: returnedItems,
      });

      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to process return.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Process Sale Return & Refund
              </h3>
              <p className="text-xs text-slate-500">
                Receipt: {transaction.receipt_number}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
              {errorMsg}
            </div>
          )}

          {/* Refund summary info */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Total Refund Amount</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {currency === 'NGN' ? '₦' : currency} {transaction.total.toLocaleString()}
              </p>
            </div>
            <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              Full Transaction Refund
            </span>
          </div>

          {/* Refund Method */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Refund Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Cash', label: 'Cash Refund' },
                { id: 'Store Credit', label: 'Customer Store Credit' },
                { id: 'Card', label: 'Card Reversal' },
                { id: 'Bank Transfer', label: 'Bank Transfer' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setRefundMethod(m.id as any)}
                  className={`py-2 px-3 border rounded-xl text-xs font-semibold transition-all ${
                    refundMethod === m.id
                      ? 'border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400'
                      : 'border-slate-200 text-slate-600 dark:border-slate-800 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Restock checkbox */}
          <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl">
            <input
              type="checkbox"
              id="restockInventory"
              checked={restockInventory}
              onChange={(e) => setRestockInventory(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500"
            />
            <label htmlFor="restockInventory" className="text-xs font-semibold text-slate-700 dark:text-slate-300 select-none">
              Automatically restore returned items to Product Inventory Stock
            </label>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Reason for Return / Refund Notes *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="e.g. Defective item, customer changed mind"
              required
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Processing...' : 'Confirm Refund'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
