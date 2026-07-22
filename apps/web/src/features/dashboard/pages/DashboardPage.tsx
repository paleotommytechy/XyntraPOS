import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth.store';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileDashboardView } from '../components/MobileDashboardView';
import { dashboardApi } from '../services/dashboard.api';
import type { DashboardMetrics } from '../services/dashboard.api';
import { Card, CardHeader, CardTitle, CardContent, Button, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@xyntra/ui';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  Plus,
  Loader2,
  Users,
  Activity,
} from 'lucide-react';
import { toast } from 'sonner';

export function DashboardPage() {
  const { isMobileMode } = useIsMobile();
  const { business } = useAuthStore();
  const navigate = useNavigate();

  if (isMobileMode) {
    return <MobileDashboardView />;
  }
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
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Calculate proportional bar heights for chart
  const maxAmount = Math.max(...metrics.chartData.map((d) => d.amount), 1);

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back, {business?.name || 'Partner'}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Here is your business performance metrics for today.
        </p>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Today's Sales Revenue
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                ₦{metrics.todayRevenue.toLocaleString()}
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 flex items-center justify-center">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Total Transactions Volume
              </p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {metrics.salesCount} Orders
              </h2>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`shadow-sm transition-all cursor-pointer hover:border-red-400 dark:hover:border-red-600 ${
            metrics.lowStockCount > 0 ? 'border-red-200 bg-red-50/10 dark:border-red-900/30' : ''
          }`}
          onClick={() => navigate('/products')}
        >
          <CardContent className="p-6 flex items-center gap-4">
            <div
              className={`h-12 w-12 rounded-xl flex items-center justify-center ${
                metrics.lowStockCount > 0
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 animate-pulse'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                Low Stock Alerts
              </p>
              <h2
                className={`text-2xl font-bold mt-1 ${
                  metrics.lowStockCount > 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {metrics.lowStockCount} Items
              </h2>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Chart Card */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Daily Revenue History</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="h-64 flex items-end justify-between gap-2 border-b dark:border-slate-800 pb-2">
            {metrics.chartData.map((d, index) => {
              const pct = (d.amount / maxAmount) * 100;
              return (
                <div key={index} className="flex-1 flex flex-col items-center group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 bg-slate-950 text-white text-[10px] px-2 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                    ₦{d.amount.toLocaleString()}
                  </div>
                  
                  {/* Bar */}
                  <div
                    style={{ height: `${Math.max(pct, 4)}%` }}
                    className="w-full max-w-[40px] rounded-t bg-gradient-to-t from-blue-600 to-blue-400 group-hover:from-blue-500 group-hover:to-blue-300 transition-all cursor-pointer shadow-sm"
                  />
                  
                  {/* Axis Label */}
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-2">
                    {d.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions & Recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions Panel */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Quick Shortcuts</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <Button
              className="w-full justify-between h-12 text-sm"
              onClick={() => navigate('/pos')}
            >
              <span className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Launch POS Checkout Console
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-between h-12 text-sm text-slate-700 dark:text-slate-300"
              onClick={() => navigate('/products')}
            >
              <span className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Inventory & Products
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              variant="secondary"
              className="w-full justify-between h-12 text-sm text-slate-700 dark:text-slate-300"
              onClick={() => navigate('/customers')}
            >
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Register Customers
              </span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Recent Sales</CardTitle>
              <Button
                variant="secondary"
                onClick={() => navigate('/pos')}
                className="text-xs h-8 px-3 py-1.5"
              >
                Go to POS
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {metrics.recentTransactions.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-sm">
                  No transaction checkouts recorded today.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Purchased On</TableHead>
                      <TableHead>Total Price</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.recentTransactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-mono text-xs">{tx.receipt_number}</TableCell>
                        <TableCell className="font-semibold text-xs">{tx.customer_name}</TableCell>
                        <TableCell className="text-xs">
                          {new Date(tx.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </TableCell>
                        <TableCell className="font-bold text-xs">
                          ₦{tx.total.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400`}
                          >
                            Paid
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
export default DashboardPage;
