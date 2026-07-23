import { useState } from 'react';
import { X, CreditCard, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import type { Customer } from '@xyntra/types';

interface SplitPaymentItem {
  id: string;
  method: 'Cash' | 'Card' | 'Transfer' | 'Store Credit';
  amount: number;
}

interface SplitPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  currency: string;
  customer?: Customer | null;
  onCompleteSplitPayment: (payments: SplitPaymentItem[]) => void;
}

export function SplitPaymentModal({
  isOpen,
  onClose,
  totalAmount,
  currency,
  customer,
  onCompleteSplitPayment,
}: SplitPaymentModalProps) {
  const [payments, setPayments] = useState<SplitPaymentItem[]>([
    { id: '1', method: 'Cash', amount: Math.round(totalAmount / 2) },
    { id: '2', method: 'Card', amount: totalAmount - Math.round(totalAmount / 2) },
  ]);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const currentTotal = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const remaining = totalAmount - currentTotal;

  const handleAddMethod = () => {
    const nextMethod = payments.some((p) => p.method === 'Cash') ? 'Card' : 'Cash';
    setPayments([
      ...payments,
      { id: Date.now().toString(), method: nextMethod, amount: Math.max(0, remaining) },
    ]);
  };

  const handleRemoveMethod = (id: string) => {
    if (payments.length <= 1) return;
    setPayments(payments.filter((p) => p.id !== id));
  };

  const handleUpdateAmount = (id: string, amount: number) => {
    setPayments(
      payments.map((p) => (p.id === id ? { ...p, amount: Math.max(0, amount) } : p))
    );
  };

  const handleUpdateMethod = (id: string, method: SplitPaymentItem['method']) => {
    setPayments(
      payments.map((p) => (p.id === id ? { ...p, method } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(remaining) > 0.5) {
      setErrorMsg(
        `Total allocated payment (${currentTotal.toLocaleString()}) does not match order total (${totalAmount.toLocaleString()}).`
      );
      return;
    }

    const creditPayment = payments.find((p) => p.method === 'Store Credit');
    if (creditPayment && customer) {
      const availCredit = customer.store_credit || 0;
      if (creditPayment.amount > availCredit) {
        setErrorMsg(
          `Store Credit payment (${creditPayment.amount}) exceeds customer available store credit balance (${availCredit}).`
        );
        return;
      }
    }

    setErrorMsg('');
    onCompleteSplitPayment(payments);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                Split / Multi-Tender Payment
              </h3>
              <p className="text-xs text-slate-500">Pay single sale across cash, card, transfer or credit</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase">Total Order Amount</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                {currency === 'NGN' ? '₦' : currency} {totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 font-semibold uppercase">Remaining Balance</p>
              <p
                className={`text-lg font-bold mt-0.5 ${
                  remaining === 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : remaining > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-red-600'
                }`}
              >
                {currency === 'NGN' ? '₦' : currency} {remaining.toLocaleString()}
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 text-xs font-semibold bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div className="space-y-3">
            {payments.map((p, idx) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm"
              >
                <span className="text-xs font-bold text-slate-400 w-5">#{idx + 1}</span>

                <select
                  value={p.method}
                  onChange={(e) => handleUpdateMethod(p.id, e.target.value as any)}
                  className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold outline-none text-slate-800 dark:text-slate-200"
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card POS</option>
                  <option value="Transfer">Bank Transfer</option>
                  <option value="Store Credit">Store Credit ({customer ? `Bal: ₦${customer.store_credit || 0}` : 'No Customer'})</option>
                </select>

                <div className="flex-1 relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-slate-400">
                    {currency === 'NGN' ? '₦' : currency}
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={p.amount || ''}
                    onChange={(e) => handleUpdateAmount(p.id, Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold outline-none text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveMethod(p.id)}
                  disabled={payments.length <= 1}
                  className="p-1.5 text-slate-400 hover:text-red-600 disabled:opacity-30 rounded-lg"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddMethod}
            className="w-full py-2.5 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-blue-500 rounded-xl text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Payment Method Tender
          </button>

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
              disabled={remaining !== 0}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>Confirm Split Checkout</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
