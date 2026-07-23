import { DollarSign, TrendingUp, PackageCheck, PieChart } from 'lucide-react';
import type { StockValuation } from '@xyntra/types';

interface StockValuationCardProps {
  valuation: StockValuation;
  currency: string;
}

export function StockValuationCard({ valuation, currency }: StockValuationCardProps) {
  const formatMoney = (val: number) => {
    return `${currency === 'NGN' ? '₦' : currency} ${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Cost Value */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Total Cost Value
          </span>
          <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3">
          {formatMoney(valuation.costValue)}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Capital invested across {valuation.totalQuantity} total units
        </p>
      </div>

      {/* Retail Valuation */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Retail Valuation
          </span>
          <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
            <PackageCheck className="h-5 w-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3">
          {formatMoney(valuation.retailValue)}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Total gross value if all stock sells out
        </p>
      </div>

      {/* Projected Gross Profit */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Potential Profit
          </span>
          <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-3">
          {formatMoney(valuation.potentialProfit)}
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Expected gross profit margin
        </p>
      </div>

      {/* Profit Margin % */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Average Margin
          </span>
          <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
            <PieChart className="h-5 w-5" />
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-3">
          {valuation.marginPercentage.toFixed(1)}%
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Weighted gross margin ratio
        </p>
      </div>
    </div>
  );
}
