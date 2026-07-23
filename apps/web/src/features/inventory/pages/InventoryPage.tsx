import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileDesktopRedirect } from '../../../components/mobile/MobileDesktopRedirect';
import { productsApi } from '../../products/services/products.api';
import { categoriesApi } from '../../categories/services/categories.api';
import { inventoryApi } from '../services/inventory.api';
import type { InventoryLog } from '../services/inventory.api';
import type { Product, Category, StockValuation, InventoryTransfer } from '@xyntra/types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Card, Button, Dialog, Input } from '@xyntra/ui';
import {
  Package,
  AlertTriangle,
  History,
  Plus,
  Minus,
  Settings2,
  RefreshCw,
  Search,
  Filter,
  ArrowRightLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { StockValuationCard } from '../components/StockValuationCard';
import { InventoryTransferModal } from '../components/InventoryTransferModal';

export function InventoryPage() {
  const { isMobileMode } = useIsMobile();
  const { business, profile } = useAuthStore();

  if (isMobileMode) {
    return <MobileDesktopRedirect featureName="Inventory Management & Restocking" />;
  }

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([]);
  const [valuation, setValuation] = useState<StockValuation>({
    totalItems: 0,
    totalQuantity: 0,
    costValue: 0,
    retailValue: 0,
    potentialProfit: 0,
    marginPercentage: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'status' | 'history' | 'transfers'>('status');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Transfer Modal
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  // Adjust Stock Modal Dialog
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustType, setAdjustType] = useState<'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT'>('STOCK_IN');
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  useEffect(() => {
    if (business?.id) {
      loadInventoryData();
    }
  }, [business?.id]);

  const loadInventoryData = async () => {
    if (!business?.id) return;
    setIsLoading(true);
    try {
      const [prodData, catData, logData, valData, transferData] = await Promise.all([
        productsApi.getProducts(business.id),
        categoriesApi.getCategories(business.id),
        inventoryApi.getInventoryLogs(business.id),
        inventoryApi.getStockValuation(business.id),
        inventoryApi.getInventoryTransfers(business.id),
      ]);
      setProducts(prodData);
      setCategories(catData);
      setLogs(logData);
      setValuation(valData);
      setTransfers(transferData);
    } catch (err) {
      toast.error('Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAdjust = (product: Product) => {
    setSelectedProduct(product);
    setAdjustType('STOCK_IN');
    setAdjustQty(0);
    setAdjustReason('');
    setIsAdjustOpen(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !profile?.id || !selectedProduct) return;
    if (adjustQty <= 0) {
      toast.error('Please enter a valid quantity greater than zero');
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      await inventoryApi.adjustStock({
        business_id: business.id,
        product_id: selectedProduct.id,
        movement_type: adjustType,
        quantity: adjustQty,
        reason: adjustReason || `${adjustType.replace('_', ' ')} stock update`,
        created_by: profile.id,
      });

      toast.success('Stock adjusted successfully!');
      setIsAdjustOpen(false);
      loadInventoryData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to adjust stock');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const handleTransferSubmit = async (data: {
    product_id: string;
    from_location: string;
    to_location: string;
    quantity: number;
    notes?: string;
  }) => {
    if (!business?.id || !profile?.id) return;
    await inventoryApi.createInventoryTransfer({
      business_id: business.id,
      product_id: data.product_id,
      from_location: data.from_location,
      to_location: data.to_location,
      quantity: data.quantity,
      notes: data.notes,
      created_by: profile.id,
    });
    toast.success('Inventory transfer initiated successfully!');
    loadInventoryData();
  };

  // Filter products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || p.category_id === categoryFilter;
    const matchesLowStock = !showLowStockOnly || p.stock_quantity <= p.minimum_stock;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const getCategoryName = (categoryId?: string) => {
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? cat.name : 'Uncategorized';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Inventory & Restocking</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor stock status, capital valuation, manual adjustments, and inter-branch transfers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => setIsTransferOpen(true)} variant="secondary" className="h-10">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Transfer Stock
          </Button>
          <Button onClick={loadInventoryData} variant="secondary" className="h-10">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stock Valuation Metric Cards */}
      <StockValuationCard valuation={valuation} currency={business?.currency || 'NGN'} />

      {/* Tabs list navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-4">
        <button
          onClick={() => setActiveTab('status')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${
            activeTab === 'status'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Stock Status ({products.length})
          </div>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Movement History
          </div>
        </button>
        <button
          onClick={() => setActiveTab('transfers')}
          className={`pb-3 font-semibold text-sm transition-all border-b-2 px-1 ${
            activeTab === 'transfers'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4" />
            Inter-Branch Transfers
          </div>
        </button>
      </div>

      {/* Tab: Stock Status workspace */}
      {activeTab === 'status' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Toolbar filters */}
          <Card className="p-4 bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search barcode, SKU, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-slate-400 shrink-0" />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="lowStockCheck"
                  checked={showLowStockOnly}
                  onChange={(e) => setShowLowStockOnly(e.target.checked)}
                  className="rounded border-slate-300 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="lowStockCheck" className="text-sm font-medium text-slate-600 dark:text-slate-300 select-none">
                  Low Stock Only
                </label>
              </div>
            </div>
          </Card>

          {/* Products Stock Table */}
          <Card className="overflow-hidden shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {isLoading ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                Loading inventory stock...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                No products found matching filters.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Details</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Retail Price</TableHead>
                    <TableHead className="text-center">Stock Level</TableHead>
                    <TableHead className="text-center">Min Threshold</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((p) => {
                    const isLowStock = p.stock_quantity <= p.minimum_stock;
                    return (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-white">{p.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            SKU: {p.sku} {p.barcode && `| BAR: ${p.barcode}`}
                          </div>
                        </TableCell>
                        <TableCell>{getCategoryName(p.category_id)}</TableCell>
                        <TableCell>₦{p.cost_price.toLocaleString()}</TableCell>
                        <TableCell>₦{p.selling_price.toLocaleString()}</TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                              p.stock_quantity === 0
                                ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200 dark:border-red-800'
                                : isLowStock
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                : 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200 dark:border-green-800'
                            }`}
                          >
                            {p.stock_quantity.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center text-slate-500 font-medium">
                          {p.minimum_stock}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button onClick={() => handleOpenAdjust(p)} variant="secondary" className="h-8 text-xs font-semibold">
                            <Settings2 className="h-3 w-3 mr-1" />
                            Adjust Stock
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* Tab: Movement History */}
      {activeTab === 'history' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <Card className="overflow-hidden shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {isLoading ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-blue-600" />
                Loading stock movement timeline...
              </div>
            ) : logs.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <History className="h-8 w-8 mx-auto mb-2" />
                No stock movement logs recorded yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Movement Date</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Movement Type</TableHead>
                    <TableHead className="text-center">Previous Stock</TableHead>
                    <TableHead className="text-center">Qty Change</TableHead>
                    <TableHead className="text-center">New Stock</TableHead>
                    <TableHead>Notes / Reason</TableHead>
                    <TableHead>Authorized By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const isAddition = log.movement_type === 'STOCK_IN' || log.movement_type === 'RETURN';
                    const isReduction = log.movement_type === 'STOCK_OUT' || log.movement_type === 'SALE';
                    
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs">
                          {new Date(log.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-slate-900 dark:text-white">{log.product?.name || 'Product'}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.product?.sku}</div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                              log.movement_type === 'STOCK_IN'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200'
                                : log.movement_type === 'STOCK_OUT'
                                ? 'bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 border-red-200'
                                : log.movement_type === 'SALE'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200'
                                : log.movement_type === 'RETURN'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200'
                                : 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200'
                            }`}
                          >
                            {log.movement_type.replace('_', ' ')}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono text-slate-500 text-xs">
                          {log.previous_stock}
                        </TableCell>
                        <TableCell className="text-center font-mono">
                          <span
                            className={`text-xs font-bold flex items-center justify-center gap-0.5 ${
                              isAddition
                                ? 'text-green-600'
                                : isReduction
                                ? 'text-red-500'
                                : 'text-slate-600'
                            }`}
                          >
                            {isAddition ? '+' : isReduction ? '-' : ''}
                            {log.quantity}
                          </span>
                        </TableCell>
                        <TableCell className="text-center font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {log.new_stock}
                        </TableCell>
                        <TableCell className="text-xs italic text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={log.reason}>
                          {log.reason || 'N/A'}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                          {log.profile?.name || 'System Auto'}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* Tab: Inter-Branch Transfers */}
      {activeTab === 'transfers' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <Card className="overflow-hidden shadow-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            {transfers.length === 0 ? (
              <div className="py-20 text-center text-slate-400">
                <ArrowRightLeft className="h-8 w-8 mx-auto mb-2" />
                No inventory transfers initiated yet.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transfer Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">{new Date(t.created_at).toLocaleString()}</TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-white">
                        {t.product?.name || 'Product'}
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">{t.from_location}</TableCell>
                      <TableCell className="text-xs text-slate-600 dark:text-slate-400">{t.to_location}</TableCell>
                      <TableCell className="text-center font-bold">{t.quantity}</TableCell>
                      <TableCell>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                          {t.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">{t.notes || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      )}

      {/* Inventory Transfer Modal */}
      <InventoryTransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        products={products}
        onSubmit={handleTransferSubmit}
      />

      {/* Manual Adjust Stock Dialog Modal */}
      <Dialog
        isOpen={isAdjustOpen}
        onClose={() => setIsAdjustOpen(false)}
        title={`Adjust Stock: ${selectedProduct?.name}`}
      >
        {selectedProduct && (
          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Current Stock Quantity:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedProduct.stock_quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Min Threshold:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{selectedProduct.minimum_stock}</span>
              </div>
            </div>

            {/* Adjust Type selections */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Adjustment Type</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'STOCK_IN', label: 'Stock In (Add)', icon: Plus, class: 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-400' },
                  { id: 'STOCK_OUT', label: 'Stock Out (Deduct)', icon: Minus, class: 'border-red-600 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 dark:border-red-400' },
                  { id: 'ADJUSTMENT', label: 'Reconcile/Adjust', icon: Settings2, class: 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-400' },
                ].map((type) => {
                  const Icon = type.icon;
                  const isActive = adjustType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setAdjustType(type.id as any)}
                      className={`h-11 border rounded-lg flex flex-col items-center justify-center gap-1 font-semibold text-[10px] transition-all ${
                        isActive
                          ? type.class
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Input
              label="Adjustment Quantity *"
              type="number"
              min="1"
              value={adjustQty || ''}
              onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
              placeholder="e.g. 10"
              required
            />

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Reason *</label>
              <textarea
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                placeholder="Specify details, e.g. 'Supplier shipment arrival', 'Broken/damaged goods write-off'"
                className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsAdjustOpen(false)}
                disabled={isSubmittingAdjust}
              >
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmittingAdjust}>
                Save Adjustment
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </div>
  );
}
export default InventoryPage;
