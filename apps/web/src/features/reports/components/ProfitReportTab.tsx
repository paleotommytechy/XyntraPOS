import { DollarSign, TrendingUp, PieChart, ShoppingBag } from 'lucide-react';

interface ProfitReportTabProps {
  revenue: number;
  cogs: number;
  discount: number;
  tax: number;
  currency: string;
}

export function ProfitReportTab({ revenue, cogs, discount, tax, currency }: ProfitReportTabProps) {
  const grossProfit = revenue - cogs - discount;
  const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netProfit = grossProfit - tax;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

  const formatMoney = (val: number) => {
    return `${currency === 'NGN' ? '₦' : currency} ${val.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return (
    <div className="space-y-6">
      {/* Top metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Gross Revenue</span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
            {formatMoney(revenue)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Total sales receipts recorded</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Cost of Goods (COGS)</span>
            <div className="p-2 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-3">
            {formatMoney(cogs)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Direct inventory cost of goods sold</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Gross Profit</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-3">
            {formatMoney(grossProfit)}
          </p>
          <p className="text-xs text-slate-400 mt-1">Margin: {grossMargin.toFixed(1)}%</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase">Net Profit Margin</span>
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-3">
            {netMargin.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-400 mt-1">After tax & discounts</p>
        </div>
      </div>

      {/* Visual Profit Breakdown */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
          Revenue to Profit Breakdown Waterfall
        </h3>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span>Gross Sales Revenue</span>
              <span className="font-bold">{formatMoney(revenue)}</span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-600 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span>Cost of Goods Sold (COGS)</span>
              <span className="text-red-500 font-bold">- {formatMoney(cogs)}</span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 rounded-full"
                style={{ width: `${Math.min(100, revenue > 0 ? (cogs / revenue) * 100 : 0)}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-medium mb-1">
              <span>Gross Profit (Pre-tax)</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatMoney(grossProfit)}</span>
            </div>
            <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, grossMargin))}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
