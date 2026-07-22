import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../stores/auth.store';
import { useCartStore } from '../../../stores/cart.store';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { MobilePOSView } from '../components/MobilePOSView';
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
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

export function POSPage() {
  const { isMobileMode } = useIsMobile();
  const { business, profile } = useAuthStore();

  if (isMobileMode) {
    return <MobilePOSView />;
  }
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

  // Dialog Modals states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);

  // Checkout states
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

  // Print ref
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

  // Load Paystack Inline SDK script
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

  // Handle Checkout submission
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id || !profile?.id) return;
    if (cartItems.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Paystack Payment integration
    if (paymentProvider === 'Paystack') {
      const pk = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
      const ref = `PAY-${Date.now()}`;
      
      if (!pk || pk === 'pk_test_placeholder' || !pk.startsWith('pk_')) {
        // Open high-fidelity simulator dialog if no valid public key configured
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
          // If setup method exists (Standard Paystack Inline v1)
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

          // If instance constructible (Paystack Inline v2)
          if (typeof PaystackObj === 'function') {
            const paystack = new PaystackObj();
            const config = {
              key: pk,
              email: customerEmail,
              amount: amountInKobo,
              currency: 'NGN',
              ref: ref,
              callback: handleSuccess,
              onSuccess: handleSuccess,
              onClose: handleClose,
              onCancel: handleClose,
            };

            if (typeof paystack.newTransaction === 'function') {
              paystack.newTransaction(config);
            } else if (typeof paystack.checkout === 'function') {
              paystack.checkout(config);
            } else {
              toast.error('Unable to open Paystack payment popup');
              setIsSubmittingCheckout(false);
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

    // Bank Transfer Verification flow
    if (paymentProvider === 'Transfer') {
      if (!transferInstantVerify) {
        // Create pending payment & transaction
        await executeFinalCheckout('Pending', 'Pending');
      } else {
        await executeFinalCheckout('Success', 'Completed');
      }
      return;
    }

    // Default Cash/Card Flow
    await executeFinalCheckout('Success', 'Completed');
  };

  // Handle Add Customer submission
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

      // Reload customers and select the newly created customer
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

  // Receipt Printing mockup
  const handlePrintReceipt = () => {
    const printContent = receiptRef.current?.innerHTML;
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = `PrintWindow_${uniqueName}`;
    
    const printWindow = window.open(windowUrl, windowName, 'left=5000,top=5000,width=0,height=0');
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

  // Filter Catalog
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getSelectedCustomer = () => {
    return customers.find((c) => c.id === customerId);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 relative">
      {/* Left side: Catalog Lookup */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Search and Filters toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Scan Barcode or Search Product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-lg border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === c.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid scrollbox */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingBag className="h-8 w-8 mb-2" />
              <p className="text-sm">No items found matching filter criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((p) => {
                const isOutOfStock = p.stock_quantity === 0;
                return (
                  <button
                    key={p.id}
                    disabled={isOutOfStock}
                    onClick={() => addToCart(p)}
                    className={`flex flex-col border dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/50 overflow-hidden text-left p-3 transition-all ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:shadow-md hover:border-blue-500 active:scale-95'
                    }`}
                  >
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-28 w-full object-cover rounded-lg mb-3"
                      />
                    ) : (
                      <div className="h-28 w-full bg-slate-50 dark:bg-slate-800/50 rounded-lg flex items-center justify-center text-slate-400 mb-3">
                        <ImageIcon className="h-6 w-6" />
                      </div>
                    )}
                    <span className="font-semibold text-sm truncate w-full dark:text-white">{p.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono mt-0.5 truncate w-full">
                      {p.sku}
                    </span>
                    <div className="flex items-center justify-between w-full mt-3">
                      <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">
                        ₦{p.selling_price.toLocaleString()}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          isOutOfStock
                            ? 'bg-red-50 text-red-600'
                            : p.stock_quantity <= p.minimum_stock
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-green-50 text-green-700'
                        }`}
                      >
                        {isOutOfStock
                          ? 'Out'
                          : p.stock_quantity <= p.minimum_stock
                          ? `Low: ${p.stock_quantity}`
                          : `Qty: ${p.stock_quantity}`}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Right side: POS Cart */}
      <aside className="w-full md:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col shadow-sm">
        {/* Cashier profile & Cart header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-slate-900 dark:text-white">Active Order</span>
          </div>
          <button
            onClick={clearCart}
            disabled={cartItems.length === 0}
            className="text-xs font-semibold text-red-600 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear Cart
          </button>
        </div>

        {/* Customer select box */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 flex gap-2 items-center">
          <select
            value={customerId || ''}
            onChange={(e) => setCustomerId(e.target.value || null)}
            className="flex-1 h-9 rounded-lg border border-slate-300 bg-white px-2 text-xs focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
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
            className="h-9 w-9 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-center hover:bg-blue-100"
            title="Register Customer"
          >
            <UserPlus className="h-4 w-4" />
          </button>
        </div>

        {/* Cart items scrollbox */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingBag className="h-10 w-10 text-slate-300" />
              <p className="text-xs">Order cart is currently empty.</p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center gap-3 p-2.5 rounded-lg border dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-xs truncate dark:text-white">{item.product.name}</p>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-0.5">
                    ₦{item.product.selling_price.toLocaleString()}
                  </p>
                </div>
                
                {/* Quantity Controls */}
                <div className="flex items-center gap-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 p-0.5">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="h-6 w-6 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-xs font-semibold px-1 min-w-[16px] text-center">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="h-6 w-6 rounded hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-500"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>

                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-16 text-right">
                  ₦{(item.product.selling_price * item.quantity).toLocaleString()}
                </span>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Cart summary calculations & payment button */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Overall Order Discount (%)</span>
            <input
              type="number"
              min="0"
              max="100"
              value={cartDiscount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              className="w-16 h-8 text-center rounded border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs dark:text-white"
            />
          </div>

          <div className="border-t border-dashed dark:border-slate-800 my-2" />

          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-red-500">
              <span>Discount ({cartDiscount}%)</span>
              <span>- ₦{discountAmount.toLocaleString()}</span>
            </div>
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
            onClick={() => setIsCheckoutOpen(true)}
            disabled={cartItems.length === 0}
            className="w-full mt-3 h-11 flex items-center justify-center gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Proceed to Payment
          </Button>
        </div>
      </aside>

      {/* Checkout Dialog Modal */}
      <Dialog
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        title="Complete Checkout"
      >
        <form onSubmit={handleCheckoutSubmit} className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-4 border dark:border-slate-800 space-y-1.5">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Checkout Summary</p>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal:</span>
              <span className="font-semibold">₦{subtotal.toLocaleString()}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Discount ({cartDiscount}%):</span>
                <span>- ₦{discountAmount.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax:</span>
              <span className="font-semibold">₦{taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-base font-bold border-t dark:border-slate-800 pt-2 text-slate-900 dark:text-white">
              <span>Total Payable:</span>
              <span className="text-blue-600 dark:text-blue-400">₦{grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Option */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Payment Provider</label>
            <div className="grid grid-cols-2 gap-3">
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
                  className={`h-11 border rounded-lg flex items-center justify-center font-medium text-xs transition-all ${
                    paymentProvider === prov.id
                      ? 'border-blue-600 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-400'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800/50'
                  }`}
                >
                  {prov.label}
                </button>
              ))}
            </div>
          </div>

          {/* Transfer Info and Toggle */}
          {paymentProvider === 'Transfer' && (
            <div className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Merchant Bank Transfer details:
              </p>
              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 bg-white dark:bg-slate-950 p-2.5 rounded border dark:border-slate-800 font-mono">
                <div>Bank Name: Xyntra Bank (Demo)</div>
                <div>Account No: 0123456789</div>
                <div>Amount: ₦{grandTotal.toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="transferInstantVerify"
                  checked={transferInstantVerify}
                  onChange={(e) => setTransferInstantVerify(e.target.checked)}
                  className="rounded border-slate-350 dark:border-slate-800 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="transferInstantVerify" className="text-xs text-slate-600 dark:text-slate-400 select-none">
                  Instant Verification (Mark as Success immediately)
                </label>
              </div>
            </div>
          )}

          {paymentProvider === 'Paystack' && (
            <div className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 rounded-lg p-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-0.5">Paystack Gateway:</span>
              Will launch the Paystack inline checkout popup. If using test credentials, a sandboxed payment dashboard simulator will display.
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsCheckoutOpen(false)}
              disabled={isSubmittingCheckout}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingCheckout}>
              Confirm Transaction
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Customer Dialog Modal */}
      <Dialog
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        title="Add Walk-in Customer"
      >
        <form onSubmit={handleAddCustomerSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name *"
              type="text"
              placeholder="e.g. Joy"
              value={custFirstName}
              onChange={(e) => setCustFirstName(e.target.value)}
              disabled={isSubmittingCustomer}
              required
            />
            <Input
              label="Last Name *"
              type="text"
              placeholder="e.g. Obi"
              value={custLastName}
              onChange={(e) => setCustLastName(e.target.value)}
              disabled={isSubmittingCustomer}
              required
            />
          </div>
          <Input
            label="Phone Number"
            type="tel"
            placeholder="e.g. 080..."
            value={custPhone}
            onChange={(e) => setCustPhone(e.target.value)}
            disabled={isSubmittingCustomer}
          />
          <div className="flex justify-end gap-3 pt-4 border-t dark:border-slate-800">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setIsAddCustomerOpen(false)}
              disabled={isSubmittingCustomer}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmittingCustomer}>
              Register & Link
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Paystack Simulator Dialog */}
      <Dialog
        isOpen={isPaystackSimOpen}
        onClose={() => setIsPaystackSimOpen(false)}
        title="Paystack Checkout Simulator"
        className="max-w-md"
      >
        <div className="bg-[#f4f7f9] dark:bg-slate-950 -m-6 p-6 flex flex-col min-h-[420px] text-slate-800 dark:text-slate-100">
          {/* Paystack Mock Header */}
          <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Merchant</div>
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">{business?.name || 'XyntraPOS Shop'}</h4>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Amount</div>
              <h4 className="font-bold text-sm text-blue-600 dark:text-blue-400">₦{grandTotal.toLocaleString()}</h4>
            </div>
          </div>

          {/* Simulator Panel Body */}
          <div className="flex-1 py-6 flex flex-col justify-between">
            {paystackSimStep === 1 ? (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-3 text-xs text-yellow-700 dark:text-yellow-400">
                  <strong>Sandbox Mode:</strong> Use any dummy card details or leave as-is to simulate checkout.
                </div>
                
                <div className="space-y-3">
                  <Input
                    label="Card Number"
                    placeholder="4012 8888 8888 8888"
                    value={paystackCardNumber}
                    onChange={(e) => setPaystackCardNumber(e.target.value)}
                    className="font-mono text-sm bg-white dark:bg-slate-900"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Card Expiry"
                      placeholder="12/28"
                      value={paystackCardExpiry}
                      onChange={(e) => setPaystackCardExpiry(e.target.value)}
                      className="font-mono text-sm bg-white dark:bg-slate-900"
                    />
                    <Input
                      label="CVV"
                      placeholder="123"
                      type="password"
                      value={paystackCardCvv}
                      onChange={(e) => setPaystackCardCvv(e.target.value)}
                      className="font-mono text-sm bg-white dark:bg-slate-900"
                    />
                  </div>
                </div>
                
                <div className="pt-4 space-y-2">
                  <Button
                    onClick={() => setPaystackSimStep(2)}
                    className="w-full bg-[#3ac58a] hover:bg-[#32af7a] text-white font-bold h-11 flex items-center justify-center gap-1.5"
                  >
                    Pay ₦{grandTotal.toLocaleString()}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setIsPaystackSimOpen(false);
                      toast.info('Payment cancelled');
                    }}
                    className="w-full h-11"
                  >
                    Cancel Payment
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center space-y-2">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    A one-time passcode (OTP) has been sent to the cardholder's phone number.
                  </p>
                  <div className="text-xs font-semibold text-slate-400">REF: {paystackReference}</div>
                </div>
                
                <div className="max-w-xs mx-auto">
                  <Input
                    placeholder="Enter 6-digit OTP code"
                    value={paystackSimOtp}
                    onChange={(e) => setPaystackSimOtp(e.target.value)}
                    className="text-center font-mono text-lg tracking-widest bg-white dark:bg-slate-900"
                  />
                </div>
                
                <div className="pt-6 space-y-2">
                  <Button
                    onClick={async () => {
                      if (!paystackSimOtp.trim()) {
                        toast.error('Please enter the OTP to authenticate transaction');
                        return;
                      }
                      await executeFinalCheckout('Success', 'Completed', paystackReference);
                    }}
                    className="w-full bg-[#3ac58a] hover:bg-[#32af7a] text-white font-bold h-11"
                  >
                    Authorize Payment
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPaystackSimStep(1)}
                    className="w-full h-11"
                  >
                    Go Back
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Paystack Mock Footer */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            Secured by <span className="font-bold text-slate-600 dark:text-slate-300">paystack</span>
          </div>
        </div>
      </Dialog>

      {/* Thermal Receipt Dialog Modal */}
      <Dialog
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        title="Receipt Invoice"
        className="max-w-sm"
      >
        {completedTransaction && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900 border dark:border-slate-800 p-4 rounded-xl">
              {/* Printable Wrapper */}
              <div ref={receiptRef} className="text-slate-950 dark:text-slate-200">
                <div className="text-center space-y-1">
                  <h3 className="text-sm font-bold uppercase tracking-wider">
                    {business?.name || 'XyntraPOS Shop'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {business?.address || 'Lagos, Nigeria'}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Phone: {business?.phone || 'N/A'}
                  </p>
                </div>

                <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-3" />

                <div className="text-[10px] space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Receipt No:</span>
                    <span className="font-mono font-bold">{completedTransaction.receipt_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{new Date(completedTransaction.created_at).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span>{profile?.name || 'Admin'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>
                      {getSelectedCustomer()
                        ? `${getSelectedCustomer()?.first_name} ${getSelectedCustomer()?.last_name}`
                        : 'Walk-in'}
                    </span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-3" />

                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-dashed border-slate-300 dark:border-slate-700">
                      <th className="pb-1">Item</th>
                      <th className="pb-1 text-center">Qty</th>
                      <th className="pb-1 text-right">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr key={item.product.id}>
                        <td className="py-1 max-w-[120px] truncate">{item.product.name}</td>
                        <td className="py-1 text-center">{item.quantity}</td>
                        <td className="py-1 text-right">
                          ₦{(item.product.selling_price * item.quantity).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-3" />

                <div className="text-[10px] space-y-1 text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₦{completedTransaction.subtotal?.toLocaleString()}</span>
                  </div>
                  {completedTransaction.discount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Discount:</span>
                      <span>- ₦{completedTransaction.discount?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax:</span>
                    <span>+ ₦{completedTransaction.tax?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-xs text-slate-900 dark:text-white pt-1">
                    <span>Grand Total:</span>
                    <span>₦{completedTransaction.total?.toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t border-dashed border-slate-300 dark:border-slate-700 my-3" />

                <div className="text-center text-[9px] text-slate-500 font-semibold uppercase tracking-wider">
                  Thank you for shopping with us!
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={handlePrintReceipt}>
                <FileText className="h-4 w-4 mr-2" />
                Print Receipt
              </Button>
              <Button className="flex-1" onClick={() => setIsReceiptOpen(false)}>
                Close Invoice
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
export default POSPage;
