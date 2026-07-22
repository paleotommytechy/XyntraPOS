import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { useCartStore } from '../../../stores/cart.store';
import { productsApi } from '../../products/services/products.api';
import { categoriesApi } from '../../categories/services/categories.api';
import { customersApi } from '../../customers/services/customers.api';
import { posApi } from '../services/pos.api';
import type { CheckoutCartItem } from '../services/pos.api';
import type { Product, Category, Customer } from '@xyntra/types';
import { Button, Input, Dialog } from '@xyntra/ui';
import {
  Search,
  ShoppingBag,
  Trash2,
  UserPlus,
  Loader2,
  DollarSign,
  Plus,
  Minus,
  X,
  Image as ImageIcon,
  CheckCircle2,
  Share2,
  Printer,
  ChevronUp,
} from 'lucide-react';
import { toast } from 'sonner';

export function MobilePOSView() {
  const { business, profile } = useAuthStore();
  const {
    items: cartItems,
    customerId,
    discount: cartDiscount,
    addToCart,
    removeFromCart,
    updateQuantity,
    setCustomerId,
    setDiscount,
    clearCart,
  } = useCartStore();

  // Catalog states
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Sheet / Modal visibility states
  const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Payment states
  const [paymentProvider, setPaymentProvider] = useState<'Paystack' | 'Cash' | 'Transfer' | 'Card'>('Cash');
  const [paymentMethod, setPaymentMethod] = useState('Cash Payment');
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState<any>(null);

  // Paystack & Transfer simulation states
  const [isPaystackSimOpen, setIsPaystackSimOpen] = useState(false);
  const [paystackSimStep, setPaystackSimStep] = useState<1 | 2>(1);
  const [paystackCardNumber, setPaystackCardNumber] = useState('');
  const [paystackCardExpiry, setPaystackCardExpiry] = useState('');
  const [paystackCardCvv, setPaystackCardCvv] = useState('');
  const [paystackSimOtp, setPaystackSimOtp] = useState('');
  const [paystackReference, setPaystackReference] = useState('');
  const [transferInstantVerify, setTransferInstantVerify] = useState(true);

  // Customer Form states
  const [custFirstName, setCustFirstName] = useState('');
  const [custLastName, setCustLastName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [isSubmittingCustomer, setIsSubmittingCustomer] = useState(false);

  // Print Ref
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (business?.id) {
      loadPOSData();
    }
  }, [business?.id]);

  const loadPOSData = async () => {
    if (!business?.id) return;
    setIsLoading(true);
    try {
      const [pData, cData, custData] = await Promise.all([
        productsApi.getProducts(business.id),
        categoriesApi.getCategories(business.id),
        customersApi.getCustomers(business.id),
      ]);
      setProducts(pData.filter((p) => p.is_active));
      setCategories(cData);
      setCustomers(custData);
    } catch (err) {
      toast.error('Failed to load POS catalog data');
    } finally {
      setIsLoading(false);
    }
  };

  // Math Calculations
  const subtotal = cartItems.reduce((acc, item) => acc + item.product.selling_price * item.quantity, 0);
  const discountAmount = subtotal * (cartDiscount / 100);
  const taxRate = business?.tax_rate || 0.075;
  const taxAmount = (subtotal - discountAmount) * taxRate;
  const grandTotal = subtotal - discountAmount + taxAmount;
  const totalItemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Paystack loader
  const loadPaystackScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ((window as any).PaystackPop) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const executeFinalCheckout = async (
    payStatus: 'Success' | 'Pending' | 'Failed',
    txStatus: 'Completed' | 'Pending' | 'Cancelled',
    payRef?: string
  ) => {
    if (!business?.id || !profile?.id) return;
    setIsSubmittingCheckout(true);
    try {
      const itemsPayload: CheckoutCartItem[] = cartItems.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        unit_price: item.product.selling_price,
        discount: 0,
        total: item.product.selling_price * item.quantity,
      }));

      const transaction = await posApi.checkout(
        {
          business_id: business.id,
          cashier_id: profile.id,
          customer_id: customerId || undefined,
          subtotal,
          discount: discountAmount,
          tax: taxAmount,
          total: grandTotal,
          payment_provider: paymentProvider,
          payment_method: paymentMethod,
          payment_status: payStatus,
          transaction_status: txStatus,
          payment_reference: payRef || `REF-${Date.now().toString().slice(-6)}`,
        },
        itemsPayload
      );

      setCompletedTransaction(transaction);
      toast.success(
        payStatus === 'Success'
          ? 'Transaction checkout complete!'
          : 'Transaction registered as PENDING. Awaiting confirmation.'
      );
      setIsCheckoutOpen(false);
      setIsPaystackSimOpen(false);
      setIsCartSheetOpen(false);

      if (payStatus === 'Success') {
        setIsReceiptOpen(true);
      }
      clearCart();
      loadPOSData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to complete checkout');
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !profile?.id) return;
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (paymentProvider === 'Paystack') {
      const pk = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      const ref = `PAY-${Date.now()}`;

      if (!pk || pk === 'pk_test_placeholder' || !pk.startsWith('pk_')) {
        setPaystackReference(ref);
        setPaystackSimStep(1);
        setPaystackCardNumber('');
        setPaystackCardExpiry('');
        setPaystackCardCvv('');
        setPaystackSimOtp('');
        setIsCheckoutOpen(false);
        setIsPaystackSimOpen(true);
        return;
      }

      setIsSubmittingCheckout(true);
      try {
        const loaded = await loadPaystackScript();
        if (!loaded) {
          toast.error('Failed to load Paystack payment gateway');
          setIsSubmittingCheckout(false);
          return;
        }

        const activeCustomer = customers.find((c) => c.id === customerId);
        const customerEmail = activeCustomer?.email || 'walkin_customer@xyntra.com';
        const amountInKobo = Math.round(grandTotal * 100);

        const handleSuccess = function (response: any) {
          const paymentRef = response?.reference || response?.trxref || ref;
          executeFinalCheckout('Success', 'Completed', paymentRef);
        };

        const handleClose = function () {
          toast.info('Paystack checkout window closed');
          setIsSubmittingCheckout(false);
        };

        const PaystackObj = (window as any).PaystackPop;
        if (PaystackObj) {
          if (typeof PaystackObj.setup === 'function') {
            const handler = PaystackObj.setup({
              key: pk,
              email: customerEmail,
              amount: amountInKobo,
              currency: 'NGN',
              ref: ref,
              callback: handleSuccess,
              onSuccess: handleSuccess,
              onClose: handleClose,
              onCancel: handleClose,
            });
            if (handler && typeof handler.openIframe === 'function') {
              handler.openIframe();
            } else if (handler && typeof handler.open === 'function') {
              handler.open();
            }
            return;
          }
        }
        toast.error('Paystack SDK failed to initialize');
        setIsSubmittingCheckout(false);
      } catch (err: any) {
        toast.error(err.message || 'Paystack initialization failed');
        setIsSubmittingCheckout(false);
      }
      return;
    }

    if (paymentProvider === 'Transfer') {
      if (!transferInstantVerify) {
        await executeFinalCheckout('Pending', 'Pending');
      } else {
        await executeFinalCheckout('Success', 'Completed');
      }
      return;
    }

    await executeFinalCheckout('Success', 'Completed');
  };

  const handleAddCustomerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;
    if (!custFirstName.trim() || !custLastName.trim()) {
      toast.error('First and Last name are required');
      return;
    }

    setIsSubmittingCustomer(true);
    try {
      const newCust = await customersApi.createCustomer({
        business_id: business.id,
        first_name: custFirstName,
        last_name: custLastName,
        phone: custPhone || undefined,
      });

      const custData = await customersApi.getCustomers(business.id);
      setCustomers(custData);
      setCustomerId(newCust.id);

      toast.success('Customer registered and linked to cart');
      setIsAddCustomerOpen(false);
      setCustFirstName('');
      setCustLastName('');
      setCustPhone('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to register customer');
    } finally {
      setIsSubmittingCustomer(false);
    }
  };

  const handlePrintReceipt = () => {
    const printContent = receiptRef.current?.innerHTML;
    const windowName = `PrintWindow_${Date.now()}`;
    const printWindow = window.open('about:blank', windowName, 'left=5000,top=5000,width=0,height=0');

    if (printWindow && printContent) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Receipt</title>
            <style>
              body { font-family: monospace; padding: 20px; font-size: 12px; line-height: 1.4; color: #000; width: 80mm; margin: 0 auto; }
              .text-center { text-align: center; }
              .divider { border-top: 1px dashed #000; margin: 10px 0; }
              table { width: 100%; border-collapse: collapse; }
              th { text-align: left; }
              .text-right { text-align: right; }
              .font-bold { font-weight: bold; }
            </style>
          </head>
          <body>
            ${printContent}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col h-full -mx-4 -mt-4 relative pb-20">
      {/* Search & Category Filter Sticky Header */}
      <div className="sticky top-14 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 p-3 space-y-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search items or scan barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Category Horizontal Scroll Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none snap-x">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap snap-start transition-all ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            All Items
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap snap-start transition-all ${
                selectedCategory === c.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Touch-First Product Grid */}
      <div className="p-3">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="h-7 w-7 animate-spin text-blue-600 mb-2" />
            <span className="text-xs font-medium">Loading catalog...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 text-center">
            <ShoppingBag className="h-10 w-10 mb-2 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-semibold">No products found</p>
            <p className="text-xs text-slate-500 mt-0.5">Try searching with a different term</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stock_quantity === 0;
              const cartItem = cartItems.find((i) => i.product.id === p.id);

              return (
                <button
                  key={p.id}
                  disabled={isOutOfStock}
                  onClick={() => addToCart(p)}
                  className={`relative flex flex-col justify-between border dark:border-slate-800/80 rounded-2xl bg-white dark:bg-slate-900 overflow-hidden text-left p-3 active:scale-95 transition-all shadow-sm ${
                    isOutOfStock
                      ? 'opacity-40 cursor-not-allowed'
                      : cartItem
                      ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/20 dark:bg-blue-950/20'
                      : 'hover:border-blue-300 dark:hover:border-blue-700'
                  }`}
                >
                  {cartItem && (
                    <span className="absolute top-2 right-2 h-6 min-w-[24px] px-1.5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center shadow-md">
                      {cartItem.quantity}
                    </span>
                  )}

                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-24 w-full object-cover rounded-xl mb-2"
                    />
                  ) : (
                    <div className="h-24 w-full bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 mb-2">
                      <ImageIcon className="h-6 w-6" />
                    </div>
                  )}

                  <div>
                    <p className="font-semibold text-xs text-slate-900 dark:text-white line-clamp-2 leading-tight">
                      {p.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{p.sku}</p>
                  </div>

                  <div className="flex items-center justify-between w-full mt-2.5 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-xs">
                      ₦{p.selling_price.toLocaleString()}
                    </span>
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-md ${
                        isOutOfStock
                          ? 'bg-red-50 text-red-600 dark:bg-red-950/30'
                          : p.stock_quantity <= p.minimum_stock
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/30'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30'
                      }`}
                    >
                      {isOutOfStock ? 'Out' : `${p.stock_quantity} left`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {totalItemCount > 0 && (
        <div className="fixed bottom-16 left-0 right-0 z-30 p-3 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-950 dark:via-slate-950">
          <button
            onClick={() => setIsCartSheetOpen(true)}
            className="w-full max-w-md mx-auto h-14 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white rounded-2xl p-4 flex items-center justify-between shadow-xl shadow-blue-600/25 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                {totalItemCount}
              </div>
              <div className="text-left">
                <p className="text-[11px] text-blue-100 font-medium leading-none">Order Summary</p>
                <p className="text-sm font-bold mt-0.5">₦{grandTotal.toLocaleString()}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 font-bold text-xs bg-white/10 px-3 py-1.5 rounded-xl">
              <span>View Cart</span>
              <ChevronUp className="h-4 w-4" />
            </div>
          </button>
        </div>
      )}

      {/* Mobile Cart Bottom Sheet Drawer */}
      {isCartSheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsCartSheetOpen(false)}
          />

          <div className="relative w-full max-h-[85vh] bg-white dark:bg-slate-900 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl z-10 animate-in slide-in-from-bottom duration-300">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 shrink-0" />

            <div className="px-4 pb-3 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Order Cart ({totalItemCount})
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearCart}
                  className="text-xs font-semibold text-red-600 hover:text-red-500 px-2 py-1"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsCartSheetOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Customer Selector */}
            <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <select
                value={customerId || ''}
                onChange={(e) => setCustomerId(e.target.value || null)}
                className="flex-1 h-10 rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name} ({c.phone || 'No Phone'})
                  </option>
                ))}
              </select>
              <button
                onClick={() => setIsAddCustomerOpen(true)}
                className="h-10 w-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-center shrink-0"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[160px]">
              {cartItems.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center justify-between p-3 rounded-xl border dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="font-semibold text-xs truncate dark:text-white">
                      {item.product.name}
                    </p>
                    <p className="text-[11px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                      ₦{item.product.selling_price.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 p-1">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-xs font-bold px-2 text-center min-w-[20px]">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="h-7 w-7 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations & Checkout Button */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Discount (%)</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={cartDiscount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-16 h-8 text-center rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none text-xs font-semibold dark:text-white"
                />
              </div>

              <div className="space-y-1 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₦{subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-500">
                    <span>Discount ({cartDiscount}%)</span>
                    <span>- ₦{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax ({(taxRate * 100).toFixed(1)}%)</span>
                  <span>+ ₦{taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-slate-900 dark:text-white pt-1">
                  <span>Grand Total</span>
                  <span className="text-blue-600 dark:text-blue-400">₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              <Button
                onClick={() => {
                  setIsCheckoutOpen(true);
                }}
                className="w-full h-12 text-sm font-bold flex items-center justify-center gap-2 rounded-xl"
              >
                <DollarSign className="h-4 w-4" />
                Proceed to Payment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Dialog Modal */}
      <Dialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Complete Checkout"
      >
        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border dark:border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal:</span>
              <span className="font-semibold">₦{subtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Discount:</span>
                <span>- ₦{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Tax:</span>
              <span className="font-semibold">₦{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm font-bold border-t dark:border-slate-800 pt-2 text-slate-900 dark:text-white mt-1">
              <span>Total Amount:</span>
              <span className="text-blue-600 dark:text-blue-400">₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Payment Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'Cash', label: 'Cash' },
                { id: 'Card', label: 'Card' },
                { id: 'Transfer', label: 'Bank Transfer' },
                { id: 'Paystack', label: 'Paystack' },
              ].map((prov) => (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => {
                    setPaymentProvider(prov.id as any);
                    setPaymentMethod(prov.label);
                  }}
                  className={`h-11 border rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                    paymentProvider === prov.id
                      ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {prov.label}
                </button>
              ))}
            </div>
          </div>

          {paymentProvider === 'Transfer' && (
            <div className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-xl p-3 space-y-2 text-xs">
              <p className="font-semibold text-slate-700 dark:text-slate-300">Bank Transfer Details:</p>
              <div className="bg-white dark:bg-slate-950 p-2 rounded-lg border dark:border-slate-800 font-mono text-[11px] space-y-0.5">
                <div>Bank: Xyntra Bank (Demo)</div>
                <div>Account: 0123456789</div>
                <div>Amount: ₦{grandTotal.toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="mTransferInstantVerify"
                  checked={transferInstantVerify}
                  onChange={(e) => setTransferInstantVerify(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <label htmlFor="mTransferInstantVerify" className="text-slate-600 dark:text-slate-400 select-none">
                  Instant Verification
                </label>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCheckoutOpen(false)}
              disabled={isSubmittingCheckout}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingCheckout}>
              Confirm Payment
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Paystack Simulator Dialog Modal */}
      <Dialog
        isOpen={isPaystackSimOpen}
        onClose={() => setIsPaystackSimOpen(false)}
        title="Paystack Sandbox Simulator"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-800">
            <p className="font-bold text-blue-800 dark:text-blue-300">Simulating Paystack Checkout</p>
            <p className="text-blue-600 dark:text-blue-400 mt-0.5 font-mono">Ref: {paystackReference}</p>
            <p className="font-bold text-slate-900 dark:text-white mt-1 text-sm">Amount: ₦{grandTotal.toLocaleString()}</p>
          </div>

          {paystackSimStep === 1 ? (
            <div className="space-y-3">
              <Input
                label="Card Number"
                placeholder="4084 0000 0000 0000"
                value={paystackCardNumber}
                onChange={(e) => setPaystackCardNumber(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Expiry"
                  placeholder="12/28"
                  value={paystackCardExpiry}
                  onChange={(e) => setPaystackCardExpiry(e.target.value)}
                />
                <Input
                  label="CVV"
                  placeholder="123"
                  value={paystackCardCvv}
                  onChange={(e) => setPaystackCardCvv(e.target.value)}
                />
              </div>
              <Button
                onClick={() => setPaystackSimStep(2)}
                className="w-full mt-2"
              >
                Pay ₦{grandTotal.toLocaleString()}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-slate-600 dark:text-slate-400">Enter sample OTP code (any 6 digits):</p>
              <Input
                label="OTP Code"
                placeholder="123456"
                value={paystackSimOtp}
                onChange={(e) => setPaystackSimOtp(e.target.value)}
              />
              <Button
                onClick={() => executeFinalCheckout('Success', 'Completed', paystackReference)}
                isLoading={isSubmittingCheckout}
                className="w-full mt-2"
              >
                Authorize Payment
              </Button>
            </div>
          )}
        </div>
      </Dialog>

      {/* Customer Dialog Modal */}
      <Dialog
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        title="Add Walk-in Customer"
      >
        <form onSubmit={handleAddCustomerSubmit} className="space-y-3">
          <Input
            label="First Name *"
            placeholder="e.g. Joy"
            value={custFirstName}
            onChange={(e) => setCustFirstName(e.target.value)}
            required
          />
          <Input
            label="Last Name *"
            placeholder="e.g. Obi"
            value={custLastName}
            onChange={(e) => setCustLastName(e.target.value)}
            required
          />
          <Input
            label="Phone Number"
            placeholder="e.g. 080..."
            value={custPhone}
            onChange={(e) => setCustPhone(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-3 border-t dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddCustomerOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingCustomer}>
              Save Customer
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Mobile Receipt Sheet */}
      <Dialog
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        title="Digital Receipt"
      >
        {completedTransaction && (
          <div className="space-y-4">
            <div className="text-center py-2">
              <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Payment Successful</h3>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Receipt #{completedTransaction.receipt_number}
              </p>
            </div>

            <div className="border dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-950 font-mono text-xs space-y-1">
              <div className="flex justify-between">
                <span>Date:</span>
                <span>{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-bold">₦{completedTransaction.total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Provider:</span>
                <span>{completedTransaction.payment_provider}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handlePrintReceipt} variant="secondary" className="flex-1 h-10 text-xs">
                <Printer className="h-4 w-4 mr-1.5" />
                Print Receipt
              </Button>
              <Button
                onClick={() => {
                  toast.success('Receipt link copied to clipboard');
                }}
                variant="secondary"
                className="flex-1 h-10 text-xs"
              >
                <Share2 className="h-4 w-4 mr-1.5" />
                Share Receipt
              </Button>
            </div>

            {/* Hidden Thermal Printable Content */}
            <div className="hidden">
              <div ref={receiptRef} className="text-slate-950">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold uppercase">{business?.name || 'XyntraPOS Shop'}</h3>
                  <p className="text-[10px]">{business?.address || 'Lagos, Nigeria'}</p>
                </div>
                <div className="divider"></div>
                <div className="text-[10px]">
                  <div>Receipt: {completedTransaction.receipt_number}</div>
                  <div>Date: {new Date().toLocaleString()}</div>
                </div>
                <div className="divider"></div>
                <div className="text-[10px] font-bold">
                  <div>Total Paid: ₦{completedTransaction.total.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
