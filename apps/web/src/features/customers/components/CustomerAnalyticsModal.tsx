import { useEffect, useState } from 'react';
import { X, Award, Wallet, ShoppingBag, DollarSign, Calendar, Tag } from 'lucide-react';
import type { Customer } from '@xyntra/types';
import { customersApi } from '../services/customers.api';
import type { CustomerAnalytics } from '../services/customers.api';

interface CustomerAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  currency: string;
}

export function CustomerAnalyticsModal({
  isOpen,
  onClose,
  customer,
  currency,
}: CustomerAnalyticsModalProps) {
  const [analytics, setAnalytics] = useState<CustomerAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && customer?.id) {
      setIsLoading(true);
      customersApi
        .getCustomerAnalytics(customer.id)
        .then((res) => setAnalytics(res))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, customer?.id]);

  if (!isOpen || !customer) return null;

  const formatMoney = (val: number) => {
    return `${currency === 'NGN' ? '₦' : currency} ${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              Customer Profile & Analytics
            </h3>
            <p className="text-xs text-slate-500">
              {customer.first_name} {customer.last_name} ({customer.phone || 'No phone'})
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Analytics Body */}
        <div className="p-6 space-y-5">
          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500">Tags:</span>
            {customer.tags && customer.tags.length > 0 ? (
              customer.tags.map((t, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                >
                  {t}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-400 italic">No tags assigned</span>
            )}
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold uppercase">Total Spend</span>
                <DollarSign className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {isLoading ? '...' : formatMoney(analytics?.totalSpent || 0)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold uppercase">Total Orders</span>
                <ShoppingBag className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {isLoading ? '...' : (analytics?.orderCount || 0)} orders
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold uppercase">Avg Ticket Size</span>
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                {isLoading ? '...' : formatMoney(analytics?.averageOrderValue || 0)}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50">
              <div className="flex items-center justify-between">
                <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold uppercase">Loyalty Points</span>
                <Award className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-xl font-bold text-amber-700 dark:text-amber-300 mt-1">
                {customer.loyalty_points || 0} Pts
              </p>
            </div>
          </div>

          {/* Store Credit Banner */}
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold">Store Credit Balance</p>
                <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                  {formatMoney(customer.store_credit || 0)}
                </p>
              </div>
            </div>
            <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">Usable at Checkout</span>
          </div>

          {/* Last purchase date */}
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Last Purchase Date:{' '}
              {analytics?.lastPurchaseDate
                ? new Date(analytics.lastPurchaseDate).toLocaleString()
                : 'No recent transaction'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
