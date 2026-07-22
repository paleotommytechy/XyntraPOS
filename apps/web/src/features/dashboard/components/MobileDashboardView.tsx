import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth.store';
import { dashboardApi } from '../services/dashboard.api';
import type { DashboardMetrics } from '../services/dashboard.api';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Loader2,
  ChevronRight,
  ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';

export function MobileDashboardView() {
  const { business, profile } = useAuthStore();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (business?.id) {
      loadDashboard();
    }
  }, [business?.id]);

  const loadDashboard = async () => {
    if (!business?.id) return;
    setIsLoading(true);
    try {
      const data = await dashboardApi.getDashboardMetrics(business.id);
      setMetrics(data);
    } catch (err) {
      toast.error('Failed to load dashboard statistics');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || !metrics) {
    return (
      <div className="h-[65vh] flex items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl p-5 shadow-lg shadow-blue-500/15">
        <p className="text-xs font-medium text-blue-100 uppercase tracking-wider">
          {profile?.name || 'Merchant'} • {profile?.role || 'Staff'}
        </p>
        <h1 className="text-xl font-bold mt-1 tracking-tight">
          {business?.name || 'XyntraPOS Store'}
        </h1>

        <button
          onClick={() => navigate('/pos')}
          className="w-full mt-4 h-12 bg-white text-blue-600 hover:bg-blue-50 active:scale-[0.98] font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all"
        >
          <ShoppingBag className="h-4 w-4" />
          Launch POS Checkout
        </button>
      </div>

      {/* Low Stock Warning Banner */}
      {metrics.lowStockCount > 0 && (
        <div
          onClick={() => navigate('/products')}
          className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer active:scale-98 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                Low Stock Alert ({metrics.lowStockCount} Items)
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                Some inventory items are below minimum threshold
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-amber-500" />
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2">
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
            Today's Sales
          </p>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5 truncate">
            ₦{metrics.todayRevenue.toLocaleString()}
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2">
            <CreditCard className="h-5 w-5" />
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
            Orders Count
          </p>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
            {metrics.salesCount} Sales
          </h2>
        </div>
      </div>

      {/* Sales History Chart summary */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Weekly Revenue Overview
        </h3>
        <div className="h-28 flex items-end justify-between gap-1.5 pt-2 border-b dark:border-slate-800 pb-2">
          {metrics.chartData.map((d, index) => {
            const maxAmt = Math.max(...metrics.chartData.map((cd) => cd.amount), 1);
            const pct = (d.amount / maxAmt) * 100;
            return (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  style={{ height: `${Math.max(pct, 6)}%` }}
                  className="w-full rounded-t-md bg-blue-600 dark:bg-blue-500 min-h-[4px]"
                />
                <span className="text-[9px] font-semibold text-slate-400 mt-1 truncate w-full text-center">
                  {d.label.slice(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity List */}
      <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Recent Transactions
          </h3>
          <button
            onClick={() => navigate('/transactions')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400"
          >
            View All
          </button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
          {metrics.recentTransactions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No transactions recorded today yet.
            </div>
          ) : (
            metrics.recentTransactions.map((tx) => (
              <div
                key={tx.id}
                onClick={() => navigate('/transactions')}
                className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40 active:bg-slate-100 dark:active:bg-slate-800 transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-mono font-bold text-xs text-slate-900 dark:text-white">
                    {tx.receipt_number}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {tx.customer_name} •{' '}
                    {new Date(tx.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                    ₦{tx.total.toLocaleString()}
                  </span>
                  <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                    Paid
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
