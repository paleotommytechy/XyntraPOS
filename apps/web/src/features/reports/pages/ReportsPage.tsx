import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileDesktopRedirect } from '../../../components/mobile/MobileDesktopRedirect';
import { XyntraSpinner } from '../../../components/XyntraSpinner';
import { transactionsApi } from '../../transactions/services/transactions.api';
import { categoriesApi } from '../../categories/services/categories.api';
import type { FullTransaction, FullTransactionItem } from '../../transactions/services/transactions.api';
import type { Category } from '@xyntra/types';
import { Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button, Input } from '@xyntra/ui';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  Calendar,
  Download,
  RefreshCw,
  Award,
  Layers,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

interface CategoryReport {
  id: string;
  name: string;
  quantitySold: number;
  revenue: number;
}

interface ProductReport {
  id: string;
  name: string;
  sku: string;
  categoryName: string;
  quantitySold: number;
  revenue: number;
  cost: number;
  profit: number;
}

export function ReportsPage() {
  const { isMobileMode } = useIsMobile();
  const { business } = useAuthStore();

  if (isMobileMode) {
    return <MobileDesktopRedirect featureName="Advanced Analytics & Reports" />;
  }
  const [transactions, setTransactions] = useState<FullTransaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allTxItems, setAllTxItems] = useState<FullTransactionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'week' | 'month' | 'custom'>('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    if (business?.id) {
      loadReportsData();
    }
  }, [business?.id]);

  const loadReportsData = async () => {
    if (!business?.id) return;
    setIsLoading(true);
    try {
      const [txData, catData] = await Promise.all([
        transactionsApi.getTransactions(business.id),
        categoriesApi.getCategories(business.id),
      ]);
      
      // Filter out transactions that aren't Success/Completed
      const successfulTx = txData.filter(t => t.payment_status === 'Success');
      setTransactions(successfulTx);
      setCategories(catData);

      // Load all line items for successful transactions
      const itemPromises = successfulTx.map(t => transactionsApi.getTransactionItems(t.id));
      const itemsArrays = await Promise.all(itemPromises);
      const collapsedItems = itemsArrays.flat();
      setAllTxItems(collapsedItems);
    } catch (err) {
      toast.error('Failed to load reports analytics');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter transactions and items based on date selections
  const getFilteredData = () => {
    const today = new Date();
    
    const filteredTx = transactions.filter((tx) => {
      const txDate = new Date(tx.created_at);
      
      if (datePreset === 'today') {
        return txDate.toDateString() === today.toDateString();
      }
      if (datePreset === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        return txDate.toDateString() === yesterday.toDateString();
      }
      if (datePreset === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(today.getDate() - 7);
        return txDate >= oneWeekAgo;
      }
      if (datePreset === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setDate(today.getDate() - 30);
        return txDate >= oneMonthAgo;
      }
      if (datePreset === 'custom') {
        let matches = true;
        if (customStartDate) {
          const start = new Date(customStartDate);
          start.setHours(0, 0, 0, 0);
          matches = matches && txDate >= start;
        }
        if (customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          matches = matches && txDate <= end;
        }
        return matches;
      }
      return true;
    });

    const txIds = new Set(filteredTx.map(t => t.id));
    const filteredItems = allTxItems.filter(item => txIds.has(item.transaction_id));

    return { filteredTx, filteredItems };
  };

  const { filteredTx, filteredItems } = getFilteredData();

  // Metrics Calculations
  const totalRevenue = filteredTx.reduce((acc, tx) => acc + tx.total, 0);
  
  // COGS = sum of (cost_price * qty)
  const totalCOGS = filteredItems.reduce((acc, item) => {
    const cost = item.product?.cost_price || 0;
    return acc + (cost * item.quantity);
  }, 0);

  const grossProfit = totalRevenue - totalCOGS;
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const totalOrders = filteredTx.length;
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Category sales breakdown
  const categoryReports: CategoryReport[] = categories.map((cat) => {
    const catItems = filteredItems.filter(item => item.product?.category_id === cat.id);
    const quantitySold = catItems.reduce((sum, item) => sum + item.quantity, 0);
    const revenue = catItems.reduce((sum, item) => sum + item.total, 0);
    return {
      id: cat.id,
      name: cat.name,
      quantitySold,
      revenue,
    };
  }).filter(c => c.quantitySold > 0).sort((a, b) => b.revenue - a.revenue);

  // Top products list
  const productSalesMap: Record<string, {
    name: string;
    sku: string;
    categoryName: string;
    quantitySold: number;
    revenue: number;
    cost: number;
  }> = {};

  filteredItems.forEach((item) => {
    if (!item.product) return;
    const pid = item.product.id;
    if (!productSalesMap[pid]) {
      productSalesMap[pid] = {
        name: item.product.name,
        sku: item.product.sku,
        categoryName: categories.find(c => c.id === item.product.category_id)?.name || 'Uncategorized',
        quantitySold: 0,
        revenue: 0,
        cost: 0,
      };
    }
    productSalesMap[pid].quantitySold += item.quantity;
    productSalesMap[pid].revenue += item.total;
    productSalesMap[pid].cost += (item.product.cost_price || 0) * item.quantity;
  });

  const productReports: ProductReport[] = Object.entries(productSalesMap).map(([id, info]) => ({
    id,
    name: info.name,
    sku: info.sku,
    categoryName: info.categoryName,
    quantitySold: info.quantitySold,
    revenue: info.revenue,
    cost: info.cost,
    profit: info.revenue - info.cost,
  })).sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 10);

  // Custom Chart Coordinates calculation
  // We'll calculate sales per day for drawing a line chart
  const getSalesTimelinePoints = () => {
    const dailyMap: Record<string, number> = {};
    
    // Sort transactions chronologically
    const sortedTx = [...filteredTx].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    sortedTx.forEach((tx) => {
      const dateStr = new Date(tx.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dailyMap[dateStr] = (dailyMap[dateStr] || 0) + tx.total;
    });

    const entries = Object.entries(dailyMap);
    if (entries.length === 0) return { points: '', labels: [] as string[] };

    const maxVal = Math.max(...entries.map(e => e[1])) || 1;
    const width = 500;
    const height = 150;

    const coordinates = entries.map(([_, val], index) => {
      const x = entries.length > 1 ? (index / (entries.length - 1)) * (width - 40) + 20 : width / 2;
      const y = height - (val / maxVal) * (height - 30) - 15;
      return `${x},${y}`;
    });

    return {
      points: coordinates.join(' '),
      labels: entries.map(e => e[0]),
      entries,
    };
  };

  const chartData = getSalesTimelinePoints();

  // Export report to CSV
  const handleExportCSV = () => {
    if (productReports.length === 0) {
      toast.info('No product sales data to export');
      return;
    }

    const headers = ['Product Name', 'SKU', 'Category', 'Quantity Sold', 'Revenue', 'Cost', 'Profit'];
    const rows = productReports.map((p) => [
      p.name,
      p.sku,
      p.categoryName,
      p.quantitySold,
      p.revenue,
      p.cost,
      p.profit,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        headers.join(','),
        ...rows.map((r) => r.map((val) => `"${val}"`).join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sales_report_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Sales report exported to CSV!');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Reports & Insights</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Analyze revenue trends, profit margins, cost of goods, and top-performing products.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadReportsData} variant="secondary" className="h-10">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportCSV} className="h-10">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Date Filter Card Toolbar */}
      <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-650 dark:text-slate-300">Reporting Period:</span>
        </div>

        <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'Last 7 Days' },
            { id: 'month', label: 'Last 30 Days' },
            { id: 'custom', label: 'Custom Range' },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => setDatePreset(preset.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border ${
                datePreset === preset.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 dark:bg-slate-950 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Custom range dates fields */}
      {datePreset === 'custom' && (
        <Card className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
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
        </Card>
      )}

      {/* Primary financial metrics grid */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm col-span-2 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Revenue</span>
            <h3 className="text-xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
              ₦{isLoading ? '...' : totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm col-span-2 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Gross Profit</span>
            <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-450 mt-1">
              ₦{isLoading ? '...' : grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-450 rounded-lg shrink-0">
            <TrendingUp className="h-5 w-5" />
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm col-span-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Profit Margin</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            {isLoading ? '...' : `${profitMargin.toFixed(1)}%`}
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-1">
            <Percent className="h-3 w-3 shrink-0" />
            Margin on Sales
          </div>
        </Card>

        <Card className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm col-span-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">AOV</span>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
            ₦{isLoading ? '...' : Math.round(averageOrderValue).toLocaleString()}
          </h3>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium mt-1">
            <ShoppingCart className="h-3 w-3 shrink-0" />
            {totalOrders} Invoice orders
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend Line Chart (custom SVG) */}
        <Card className="p-6 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-blue-600" />
              Sales Trend Timeline
            </h4>
            <span className="text-xs text-slate-400 font-medium">Currency NGN</span>
          </div>

          <div className="relative h-48 flex items-end">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                Loading line chart...
              </div>
            ) : chartData.labels.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-xs gap-1.5">
                <AlertTriangle className="h-5 w-5" />
                No sales records in this filter period to plot.
              </div>
            ) : (
              <div className="w-full h-full flex flex-col justify-between">
                {/* SVG Graph rendering */}
                <svg viewBox="0 0 500 150" className="w-full h-40 overflow-visible">
                  {/* Grid Lines */}
                  <line x1="20" y1="15" x2="480" y2="15" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                  <line x1="20" y1="65" x2="480" y2="65" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                  <line x1="20" y1="115" x2="480" y2="115" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-slate-800" />
                  <line x1="20" y1="135" x2="480" y2="135" stroke="#e2e8f0" strokeWidth="1.5" className="dark:stroke-slate-700" />
                  
                  {/* Line path */}
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartData.points}
                    className="drop-shadow-sm"
                  />
                  
                  {/* Scatter Dots */}
                  {chartData.points.split(' ').map((pt, idx) => {
                    const [x, y] = pt.split(',');
                    return (
                      <g key={idx}>
                        <circle
                          cx={x}
                          cy={y}
                          r="5.5"
                          className="fill-blue-600 stroke-white dark:stroke-slate-900"
                          strokeWidth="2"
                        />
                        <title>{chartData.labels[idx]}: ₦{chartData.entries[idx][1].toLocaleString()}</title>
                      </g>
                    );
                  })}
                </svg>
                
                {/* Date Labels under Chart */}
                <div className="flex justify-between px-4 text-[10px] text-slate-400 font-bold">
                  {chartData.labels.map((lbl, idx) => (
                    <span key={idx} className="truncate max-w-[50px]" title={lbl}>
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Category Contribution breakdown */}
        <Card className="p-6 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm space-y-4">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-purple-650" />
            Category Contributions
          </h4>

          {isLoading ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading category stats...
            </div>
          ) : categoryReports.length === 0 ? (
            <div className="py-12 text-center text-slate-450 text-xs italic">
              No categories sales data.
            </div>
          ) : (
            <div className="space-y-4.5">
              {categoryReports.map((cat, index) => {
                const percent = totalRevenue > 0 ? (cat.revenue / totalRevenue) * 100 : 0;
                const colors = ['bg-blue-600', 'bg-emerald-500', 'bg-amber-500', 'bg-pink-500', 'bg-indigo-500'];
                const progressColor = colors[index % colors.length];
                
                return (
                  <div key={cat.id} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-350">{cat.name}</span>
                      <span className="text-slate-900 dark:text-white">
                        ₦{cat.revenue.toLocaleString()} ({percent.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${progressColor}`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Top Performing products table */}
      <Card className="p-6 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-500" />
            Top Selling Products
          </h4>
          <span className="text-xs text-slate-400 font-medium">Ranked by Quantity Sold</span>
        </div>

        {isLoading ? (
          <div className="py-8">
            <XyntraSpinner size="sm" />
          </div>
        ) : productReports.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs italic">
            No products sold records in selected period.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Units Sold</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Cost Value</TableHead>
                <TableHead className="text-right">Gross Profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productReports.map((p) => (
                <TableRow key={p.id} className="hover:bg-transparent">
                  <TableCell>
                    <div className="font-semibold text-slate-900 dark:text-white text-xs">{p.name}</div>
                    <div className="text-[10px] text-slate-450 font-mono mt-0.5">{p.sku}</div>
                  </TableCell>
                  <TableCell>{p.categoryName}</TableCell>
                  <TableCell className="text-center font-mono font-bold text-xs">{p.quantitySold}</TableCell>
                  <TableCell className="text-right text-xs">₦{p.revenue.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-xs text-slate-450">₦{p.cost.toLocaleString()}</TableCell>
                  <TableCell className="text-right text-xs font-bold text-emerald-600">
                    ₦{p.profit.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
export default ReportsPage;
