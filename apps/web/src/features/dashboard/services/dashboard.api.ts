import { supabase } from '../../../lib/supabase';

export interface DashboardMetrics {
  todayRevenue: number;
  salesCount: number;
  lowStockCount: number;
  recentTransactions: any[];
  chartData: { label: string; amount: number }[];
}

export const dashboardApi = {
  async getDashboardMetrics(businessId: string): Promise<DashboardMetrics> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayStr = todayStart.toISOString();

    // 1. Query today's sales
    const { data: todayTx, error: txError } = await supabase
      .from('transactions')
      .select('total')
      .eq('business_id', businessId)
      .gte('created_at', todayStr);

    if (txError) throw txError;
    const todayRevenue = (todayTx || []).reduce((acc, t) => acc + (t.total || 0), 0);
    const salesCount = (todayTx || []).length;

    // 2. Query low stock counts
    const { data: stockData, error: stockError } = await supabase
      .from('products')
      .select('stock_quantity, minimum_stock')
      .eq('business_id', businessId)
      .is('deleted_at', null)
      .eq('is_active', true);

    if (stockError) throw stockError;
    const lowStockCount = (stockData || []).filter(
      (p) => p.stock_quantity <= p.minimum_stock
    ).length;

    // 3. Query last 5 recent orders
    const { data: recentTx, error: recentError } = await supabase
      .from('transactions')
      .select(
        `
        id,
        receipt_number,
        total,
        payment_status,
        created_at,
        customer:customers(first_name, last_name)
      `
      )
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    const recentTransactions = (recentTx || []).map((t: any) => ({
      id: t.id,
      receipt_number: t.receipt_number,
      total: t.total,
      payment_status: t.payment_status,
      created_at: t.created_at,
      customer_name: t.customer
        ? `${t.customer.first_name} ${t.customer.last_name}`
        : 'Walk-in',
    }));

    // 4. Query daily sales chart aggregates (last 7 days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const { data: dayTx } = await supabase
        .from('transactions')
        .select('total')
        .eq('business_id', businessId)
        .gte('created_at', dayStart.toISOString())
        .lte('created_at', dayEnd.toISOString());

      const dayAmount = (dayTx || []).reduce((acc, t) => acc + (t.total || 0), 0);
      chartData.push({
        label: dayStart.toLocaleDateString([], { weekday: 'short' }),
        amount: dayAmount,
      });
    }

    return {
      todayRevenue,
      salesCount,
      lowStockCount,
      recentTransactions,
      chartData,
    };
  },
};
