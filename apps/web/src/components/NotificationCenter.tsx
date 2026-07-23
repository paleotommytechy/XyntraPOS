import { useState, useEffect } from 'react';
import { Bell, CheckCheck, AlertTriangle, Info, CheckCircle2, X } from 'lucide-react';
import type { NotificationItem } from '@xyntra/types';
import { useAuthStore } from '../stores/auth.store';
import { productsApi } from '../features/products/services/products.api';

export function NotificationCenter() {
  const { business } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (business?.id) {
      loadNotifications();
    }
  }, [business?.id]);

  const loadNotifications = async () => {
    if (!business?.id) return;
    setIsLoading(true);
    try {
      // Query low stock items for real notification alerts
      const products = await productsApi.getProducts(business.id);
      const lowStockThreshold = business.low_stock_threshold || 5;

      const lowStockNotifications: NotificationItem[] = products
        .filter((p) => p.stock_quantity <= lowStockThreshold)
        .slice(0, 10)
        .map((p) => ({
          id: `low_stock_${p.id}`,
          business_id: business.id,
          title: 'Low Stock Alert',
          message: `Product "${p.name}" is low on stock (${p.stock_quantity} left).`,
          type: p.stock_quantity === 0 ? 'ERROR' : 'WARNING',
          is_read: false,
          created_at: p.updated_at || new Date().toISOString(),
        }));

      setNotifications(lowStockNotifications);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification items */}
            <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
              {isLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">Checking store alerts...</div>
              ) : notifications.length > 0 ? (
                notifications.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 flex items-start justify-between gap-3 transition-colors ${
                      !item.is_read
                        ? 'bg-blue-50/40 dark:bg-blue-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {item.type === 'ERROR' && (
                          <div className="p-1.5 rounded-lg bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                        )}
                        {item.type === 'WARNING' && (
                          <div className="p-1.5 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                        )}
                        {item.type === 'SUCCESS' && (
                          <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
                            <CheckCircle2 className="h-4 w-4" />
                          </div>
                        )}
                        {item.type === 'INFO' && (
                          <div className="p-1.5 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                            <Info className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {item.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">{item.message}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeNotification(item.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 text-xs italic">
                  No unread notifications or low stock alerts.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
