import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobileProductsView } from '../components/MobileProductsView';
import { productsApi } from '../services/products.api';
import { categoriesApi } from '../../categories/services/categories.api';
import { uploadImageToCloudinary } from '../../../utils/cloudinary';
import type { Product, Category } from '@xyntra/types';
import {
  Button,
  Input,
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Dialog,
} from '@xyntra/ui';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Layers,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

export function ProductsPage() {
  const { isMobileMode } = useIsMobile();
  const { business } = useAuthStore();

  if (isMobileMode) {
    return <MobileProductsView />;
  }
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');
  
  // Data states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal Dialog states
  const [isProductOpen, setIsProductOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states - Product
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodCost, setProdCost] = useState('0');
  const [prodSelling, setProdSelling] = useState('0');
  const [prodStock, setProdStock] = useState('0');
  const [prodMinStock, setProdMinStock] = useState('5');
  const [prodTax, setProdTax] = useState('7.5');
  const [prodImageFile, setProdImageFile] = useState<File | null>(null);
  const [prodImageUrl, setProdImageUrl] = useState('');
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  // Form states - Category
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

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
    } catch (err: any) {
      toast.error('Failed to load catalog data');
    } finally {
      setIsLoading(false);
    }
  };

  // Open Product Dialog
  const handleOpenProduct = (product: Product | null = null) => {
    setEditingProduct(product);
    if (product) {
      setProdName(product.name);
      setProdSku(product.sku);
      setProdBarcode(product.barcode || '');
      setProdCategory(product.category_id || '');
      setProdCost(product.cost_price.toString());
      setProdSelling(product.selling_price.toString());
      setProdStock(product.stock_quantity.toString());
      setProdMinStock(product.minimum_stock.toString());
      setProdTax(product.tax_rate ? (product.tax_rate * 100).toString() : '0');
      setProdImageUrl(product.image_url || '');
    } else {
      setProdName('');
      setProdSku('');
      setProdBarcode('');
      setProdCategory(categories[0]?.id || '');
      setProdCost('0');
      setProdSelling('0');
      setProdStock('0');
      setProdMinStock('5');
      setProdTax(business?.tax_rate ? (business.tax_rate * 100).toString() : '7.5');
      setProdImageUrl('');
    }
    setProdImageFile(null);
    setIsProductOpen(true);
  };

  // Open Category Dialog
  const handleOpenCategory = (category: Category | null = null) => {
    setEditingCategory(category);
    if (category) {
      setCatName(category.name);
      setCatDesc(category.description || '');
    } else {
      setCatName('');
      setCatDesc('');
    }
    setIsCategoryOpen(true);
  };

  // Submit Product Form
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    if (!prodName.trim()) {
      toast.error('Product name is required');
      return;
    }

    setIsSubmittingProduct(true);
    try {
      let finalImageUrl = prodImageUrl;
      if (prodImageFile) {
        toast.info('Uploading product image...');
        finalImageUrl = await uploadImageToCloudinary(prodImageFile);
      }

      const payload = {
        business_id: business.id,
        category_id: prodCategory || undefined,
        sku: prodSku || undefined,
        barcode: prodBarcode || undefined,
        name: prodName,
        description: '',
        image_url: finalImageUrl,
        cost_price: parseFloat(prodCost) || 0,
        selling_price: parseFloat(prodSelling) || 0,
        stock_quantity: parseInt(prodStock) || 0,
        minimum_stock: parseInt(prodMinStock) || 0,
        tax_rate: (parseFloat(prodTax) || 0) / 100,
      };

      if (editingProduct) {
        await productsApi.updateProduct(editingProduct.id, payload);
        toast.success('Product updated successfully');
      } else {
        await productsApi.createProduct(payload);
        toast.success('Product added successfully');
      }
      setIsProductOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Submit Category Form
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    if (!catName.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsSubmittingCategory(true);
    try {
      if (editingCategory) {
        await categoriesApi.updateCategory(editingCategory.id, catName, catDesc);
        toast.success('Category updated successfully');
      } else {
        await categoriesApi.createCategory(business.id, catName, catDesc);
        toast.success('Category created successfully');
      }
      setIsCategoryOpen(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Operation failed');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // Delete Product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsApi.deleteProduct(id);
      toast.success('Product deleted successfully');
      loadData();
    } catch (err: any) {
      toast.warning(err.message || 'Failed to delete product');
      loadData(); // Reload to refresh active states
    }
  };

  // Delete Category
  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    try {
      await categoriesApi.deleteCategory(id);
      toast.success('Category deleted successfully');
      loadData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete category');
    }
  };

  // Filter logic
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;

    const matchesStatus =
      selectedStatus === 'all' ||
      (selectedStatus === 'active' && p.is_active) ||
      (selectedStatus === 'inactive' && !p.is_active);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryName = (catId?: string) => {
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : 'Uncategorized';
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Product Catalog</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure items, manage categorization trees, and monitor stock values.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => handleOpenCategory(null)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
          <Button onClick={() => handleOpenProduct(null)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('products')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'products'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="h-4 w-4" />
          Products ({products.length})
        </button>
        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'categories'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="h-4 w-4" />
          Categories ({categories.length})
        </button>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : activeTab === 'products' ? (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search Name, SKU, Barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
              />
            </div>

            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
              >
                <option value="all">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>

            <div className="flex items-center justify-end text-xs text-slate-400">
              Found {filteredProducts.length} items
            </div>
          </div>

          {/* Table list */}
          {filteredProducts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-slate-400">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <span>No products matched your catalog queries.</span>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>SKU / Barcode</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Cost / Selling</TableHead>
                  <TableHead>Stock Level</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => {
                  const isLowStock = p.stock_quantity <= p.minimum_stock;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold flex items-center gap-3">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-10 w-10 rounded-lg object-cover border dark:border-slate-800"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                        <span>{p.name}</span>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-mono">{p.sku}</p>
                        {p.barcode && <p className="text-[10px] text-slate-400">{p.barcode}</p>}
                      </TableCell>
                      <TableCell>{getCategoryName(p.category_id)}</TableCell>
                      <TableCell>
                        <span className="text-xs text-slate-400">₦{p.cost_price.toLocaleString()}</span>
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                          ₦{p.selling_price.toLocaleString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-semibold ${
                              isLowStock
                                ? 'text-red-600 dark:text-red-400 font-bold'
                                : 'text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {p.stock_quantity}
                          </span>
                          <span className="text-xs text-slate-400">/ min {p.minimum_stock}</span>
                          {isLowStock && <AlertTriangle className="h-3.5 w-3.5 text-red-500" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                            p.is_active
                              ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {p.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenProduct(p)}
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {categories.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-12 text-slate-400">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <span>No categories initialized yet.</span>
              </CardContent>
            </Card>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-semibold">{c.name}</TableCell>
                    <TableCell>{c.description || <span className="text-slate-400">-</span>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenCategory(c)}
                          className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c.id)}
                          className="p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {/* Product Overlay Dialog */}
      <Dialog
        isOpen={isProductOpen}
        onClose={() => setIsProductOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
      >
        <form onSubmit={handleProductSubmit} className="space-y-4">
          <Input
            label="Product Name *"
            type="text"
            placeholder="e.g. Cordless Headset"
            value={prodName}
            onChange={(e) => setProdName(e.target.value)}
            disabled={isSubmittingProduct}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="SKU (Auto-gen if empty)"
              type="text"
              placeholder="e.g. SKU-PROD1"
              value={prodSku}
              onChange={(e) => setProdSku(e.target.value)}
              disabled={isSubmittingProduct}
            />
            <Input
              label="Barcode (Auto-gen if empty)"
              type="text"
              placeholder="e.g. BAR-10034"
              value={prodBarcode}
              onChange={(e) => setProdBarcode(e.target.value)}
              disabled={isSubmittingProduct}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Category
            </label>
            <select
              value={prodCategory}
              onChange={(e) => setProdCategory(e.target.value)}
              disabled={isSubmittingProduct}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cost Price (₦)"
              type="number"
              min="0"
              step="0.01"
              value={prodCost}
              onChange={(e) => setProdCost(e.target.value)}
              disabled={isSubmittingProduct}
            />
            <Input
              label="Selling Price (₦) *"
              type="number"
              min="0"
              step="0.01"
              value={prodSelling}
              onChange={(e) => setProdSelling(e.target.value)}
              disabled={isSubmittingProduct}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Stock Qty"
              type="number"
              min="0"
              value={prodStock}
              onChange={(e) => setProdStock(e.target.value)}
              disabled={isSubmittingProduct}
            />
            <Input
              label="Min Alert Qty"
              type="number"
              min="0"
              value={prodMinStock}
              onChange={(e) => setProdMinStock(e.target.value)}
              disabled={isSubmittingProduct}
            />
            <Input
              label="Tax Rate (%)"
              type="number"
              step="0.1"
              value={prodTax}
              onChange={(e) => setProdTax(e.target.value)}
              disabled={isSubmittingProduct}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Product Image
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={isSubmittingProduct}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setProdImageFile(e.target.files[0]);
                }
              }}
              className="flex w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-800 dark:file:text-blue-400"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsProductOpen(false)}
              disabled={isSubmittingProduct}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingProduct}>
              {editingProduct ? 'Save Changes' : 'Add Product'}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Category Overlay Dialog */}
      <Dialog
        isOpen={isCategoryOpen}
        onClose={() => setIsCategoryOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <Input
            label="Category Name *"
            type="text"
            placeholder="e.g. Beverages"
            value={catName}
            onChange={(e) => setCatName(e.target.value)}
            disabled={isSubmittingCategory}
            required
          />

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Description
            </label>
            <textarea
              placeholder="Provide a description..."
              value={catDesc}
              onChange={(e) => setCatDesc(e.target.value)}
              disabled={isSubmittingCategory}
              rows={3}
              className="flex w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCategoryOpen(false)}
              disabled={isSubmittingCategory}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingCategory}>
              {editingCategory ? 'Save Changes' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
export default ProductsPage;
