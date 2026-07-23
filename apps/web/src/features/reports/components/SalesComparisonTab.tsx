import { TrendingUp, TrendingDown, ArrowUpRight, Calendar } from 'lucide-react';

interface SalesComparisonTabProps {
  currentRevenue: number;
  currentCount: number;
  previousRevenue: number;
  previousCount: number;
  currency: string;
}

export function SalesComparisonTab({
  currentRevenue,
  currentCount,
  previousRevenue,
  previousCount,
  currency,
}: SalesComparisonTabProps) {
  const revDiff = currentRevenue - previousRevenue;
  const revGrowth = previousRevenue > 0 ? (revDiff / previousRevenue) * 100 : 0;
  const isPositiveGrowth = revGrowth >= 0;

  const formatMoney = (val: number) => {
    return `${currency === 'NGN' ? '₦' : currency} ${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Period Revenue Growth</span>
            <div
              className={`p-2 rounded-xl ${
                isPositiveGrowth
                  ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'
              }`}
            >
              {isPositiveGrowth ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <p
              className={`text-3xl font-bold ${
                isPositiveGrowth ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
              }`}
            >
              {isPositiveGrowth ? '+' : ''}
              {revGrowth.toFixed(1)}%
            </p>
            <span className="text-xs text-slate-400 font-semibold">
              ({isPositiveGrowth ? '+' : ''}
              {formatMoney(revDiff)})
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Compared to previous period baseline</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Current Period Sales</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
            {formatMoney(currentRevenue)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{currentCount} transactions completed</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Previous Period Sales</span>
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <ArrowUpRight className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
            {formatMoney(previousRevenue)}
          </p>
          <p className="text-xs text-slate-400 mt-1">{previousCount} transactions completed</p>
        </div>
      </div>
    </div>
  );
}
