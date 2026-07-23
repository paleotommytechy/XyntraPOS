import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  LayoutDashboard,
  ShoppingBag,
  Layers,
  Package,
  Users,
  Receipt,
  BarChart3,
  UserCheck,
  Settings,
  X,
  PlusCircle,
  Command,
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by parent or toggle
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'dash', title: 'Go to Dashboard', icon: LayoutDashboard, path: '/dashboard', category: 'Navigation' },
    { id: 'pos', title: 'Open POS Checkout', icon: ShoppingBag, path: '/pos', category: 'Navigation' },
    { id: 'products', title: 'Manage Products', icon: Layers, path: '/products', category: 'Navigation' },
    { id: 'inventory', title: 'Inventory & Stock Logs', icon: Package, path: '/inventory', category: 'Navigation' },
    { id: 'customers', title: 'Customer Database & Loyalty', icon: Users, path: '/customers', category: 'Navigation' },
    { id: 'transactions', title: 'Transactions & Receipts', icon: Receipt, path: '/transactions', category: 'Navigation' },
    { id: 'reports', title: 'Analytics & Profit Reports', icon: BarChart3, path: '/reports', category: 'Navigation' },
    { id: 'staff', title: 'Staff Team & Shift Logs', icon: UserCheck, path: '/staff', category: 'Navigation' },
    { id: 'settings', title: 'Store Settings', icon: Settings, path: '/settings', category: 'Navigation' },
    { id: 'new-product', title: 'Quick Action: Add Product', icon: PlusCircle, path: '/products?action=new', category: 'Actions' },
    { id: 'new-customer', title: 'Quick Action: New Customer', icon: PlusCircle, path: '/customers?action=new', category: 'Actions' },
  ];

  const filtered = actions.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (path: string) => {
    onClose();
    setQuery('');
    navigate(path);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 bg-slate-900/60 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Search Header */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="h-5 w-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search feature... (e.g. POS, Customers, Reports)"
            autoFocus
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
          />
          <div className="flex items-center gap-1.5">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
              ESC
            </kbd>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length > 0 ? (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.path)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-50 group-hover:text-blue-600 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400 transition-colors">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">
                    {item.category}
                  </span>
                </button>
              );
            })
          ) : (
            <div className="py-8 text-center text-sm text-slate-500">
              No matching commands or pages found.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Command className="h-3.5 w-3.5" />
            <span>XyntraPOS Quick Command Palette</span>
          </div>
          <span>Navigation Shortcut</span>
        </div>
      </div>
    </div>
  );
}
