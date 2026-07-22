import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { productsApi } from '../services/products.api';
import { categoriesApi } from '../../categories/services/categories.api';
import type { Product, Category } from '@xyntra/types';
import { Search, Loader2, Layers, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

export function MobileProductsView() {
  const { business } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    if (business?.id) {
      loadData();
    }
  }, [business?.id]);

  const loadData = async () => {
    if (!business?.id) return;
    setIsLoading(true);
    try {
      const [pData, cData] = await Promise.all([
        productsApi.getProducts(business.id),
        categoriesApi.getCategories(business.id),
      ]);
      setProducts(pData);
      setCategories(cData);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-3">
      <div className="space-y-2.5">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
          Product Lookup
        </h1>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Category Pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none snap-x">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap snap-start transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Products ({products.length})
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap snap-start transition-all ${
                selectedCategory === c.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Cards */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="h-7 w-7 animate-spin text-blue-600 mb-2" />
          <span className="text-xs font-medium">Loading catalog...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center">
          <Layers className="h-10 w-10 mb-2 text-slate-300 dark:text-slate-700" />
          <p className="text-sm font-semibold">No products found</p>
          <p className="text-xs text-slate-500 mt-0.5">Try searching another term</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stock_quantity === 0;
            const isLowStock = p.stock_quantity <= p.minimum_stock;

            return (
              <div
                key={p.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-3 flex items-center gap-3 shadow-sm"
              >
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.name}
                    className="h-14 w-14 object-cover rounded-xl shrink-0"
                  />
                ) : (
                  <div className="h-14 w-14 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 shrink-0">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {p.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</p>

                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="font-extrabold text-xs text-blue-600 dark:text-blue-400">
                      ₦{p.selling_price.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-slate-400">•</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Cost: ₦{p.cost_price.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block ${
                      isOutOfStock
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/40'
                        : isLowStock
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40'
                        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40'
                    }`}
                  >
                    {isOutOfStock ? 'Out of Stock' : `${p.stock_quantity} units`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
