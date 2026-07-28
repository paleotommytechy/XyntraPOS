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
import type { Product, Category, Customer, DraftOrder } from '@xyntra/types';
import { Button, Input, Dialog, PromptModal, ConfirmModal } from '@xyntra/ui';
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
  Save,
  CreditCard,
  Keyboard,
  Award,
  WifiOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { DraftOrdersModal } from '../components/DraftOrdersModal';
import { SplitPaymentModal } from '../components/SplitPaymentModal';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { ThermalReceiptModal } from '../components/ThermalReceiptModal';
import { useOnlineStatus } from '../../../hooks/useOnlineStatus';
import { useBarcodeScanner } from '../../../hooks/useBarcodeScanner';
import { useRealtimeSubscription } from '../../../hooks/useRealtimeSubscription';
import { posSyncManager } from '../services/posSyncManager';

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
  const [drafts, setDrafts] = useState<DraftOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Dialog Modals states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [isSplitPaymentOpen, setIsSplitPaymentOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isClearCartConfirmOpen, setIsClearCartConfirmOpen] = useState(false);
  const [promptModal, setPromptModal] = useState<{
    isOpen: boolean;
    title: string;
    message?: string;
    defaultValue?: string;
    inputType?: string;
    onSubmit: (val: string) => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    defaultValue: '',
    inputType: 'text',
    onSubmit: () => {},
  });

  // Offline Queue & Connectivity State
  const isOnline = useOnlineStatus();
  const [offlineQueueCount, setOfflineQueueCount] = useState(0);

  useEffect(() => {
    posSyncManager.initAutoSync();
    setOfflineQueueCount(posSyncManager.getQueue().length);
  }, [isOnline]);

  // Realtime Supabase product catalog listener
  useRealtimeSubscription({
    table: 'products',
    businessId: business?.id,
    onPayload: () => {
      loadPOSData();
    },
    enabled: !!business?.id,
  });

  // Barcode Scanner hardware listener
  useBarcodeScanner({
    onScan: (code) => {
      const match = products.find(
        (p) =>
          (p.barcode && p.barcode.toLowerCase() === code.toLowerCase()) ||
          p.sku.toLowerCase() === code.toLowerCase()
      );
      if (match) {
        if (match.stock_quantity > 0) {
          addToCart(match);
          toast.success(`Scanned: ${match.name}`);
        } else {
          toast.error(`Scanned item "${match.name}" is Out of Stock!`);
        }
      } else {
        toast.error(`No product found matching scanned barcode "${code}"`);
      }
    },
    enabled: !isCheckoutOpen && !isDraftsModalOpen && !isSplitPaymentOpen,
  });

  // Checkout states
  const [paymentProvider, setPaymentProvider] = useState<'Paystack' | 'Cash' | 'Transfer' | 'Card' | 'Store Credit'>('Cash');
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

  // Hotkey listener for POS
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F1: Product search
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      // F2: Discount modal focus / alert
      if (e.key === 'F2') {
        e.preventDefault();
        setPromptModal({
          isOpen: true,
          title: 'Set Cart Discount',
          message: 'Enter discount percentage (0 - 100):',
          defaultValue: cartDiscount.toString(),
          inputType: 'number',
          onSubmit: (disc) => {
            if (disc !== null && disc !== '') {
              setDiscount(Math.min(100, Math.max(0, parseFloat(disc) || 0)));
            }
          },
        });
      }
      // F3 or Ctrl+D: Save draft
      if (e.key === 'F3' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd')) {
        e.preventDefault();
        handleSaveDraft();
      }
      // Space or Enter: Checkout trigger (when not in input)
      if ((e.key === 'Enter' || e.key === ' ') && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        if (cartItems.length > 0 && !isCheckoutOpen && !promptModal.isOpen) {
          e.preventDefault();
          setIsCheckoutOpen(true);
        }
      }
      // Esc: Clear cart
      if (e.key === 'Escape') {
        if (!isCheckoutOpen && !isDraftsModalOpen && !isSplitPaymentOpen && !isShortcutsModalOpen && !promptModal.isOpen && !isClearCartConfirmOpen) {
          if (cartItems.length > 0) {
            setIsClearCartConfirmOpen(true);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, cartDiscount, isCheckoutOpen, isDraftsModalOpen, isSplitPaymentOpen, isShortcutsModalOpen, promptModal.isOpen, isClearCartConfirmOpen]);

  useEffect(() => {
    if (business?.id) {
      loadPOSData();
    }
  }, [business?.id]);

  const loadPOSData = async () => {
    if (!business?.id) return;
    setIsLoading(true);
    try {
      const [pData, cData, custData, draftData] = await Promise.all([
        productsApi.getProducts(business.id),
        categoriesApi.getCategories(business.id),
        customersApi.getCustomers(business.id),
        posApi.getDraftOrders(business.id),
      ]);
      setProducts(pData.filter((p) => p.is_active));
      setCategories(cData);
      setCustomers(custData);
      setDrafts(draftData);
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

  const handleSaveDraft = async () => {
    if (!business?.id) return;
    if (cartItems.length === 0) {
      toast.error('Cart is empty. Add items to save a draft.');
      return;
    }
    setPromptModal({
      isOpen: true,
      title: 'Save Draft Order',
      message: 'Enter a name/reference for this draft order:',
      defaultValue: `Cart #${drafts.length + 1}`,
      inputType: 'text',
      onSubmit: async (title) => {
        if (!title || !title.trim()) return;

        try {
          const draft = await posApi.saveDraftOrder({
            business_id: business.id,
            customer_id: customerId,
            title: title.trim(),
            items: cartItems,
            discount: cartDiscount,
            subtotal,
            total: grandTotal,
            created_by: profile?.id,
          });

          setDrafts([draft, ...drafts]);
          toast.success('Cart saved to Draft Orders successfully!');
          clearCart();
        } catch (err: any) {
          toast.error('Failed to save draft order');
        }
      },
    });
  };

  const handleLoadDraft = (draft: DraftOrder) => {
    clearCart();
    draft.items.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        addToCart(item.product);
      }
    });
    if (draft.customer_id) setCustomerId(draft.customer_id);
    if (draft.discount) setDiscount(draft.discount);
    setIsDraftsModalOpen(false);
    toast.success(`Loaded draft "${draft.title}" into cart`);
  };

  const handleDeleteDraft = async (draftId: string) => {
    await posApi.deleteDraftOrder(draftId);
    setDrafts(drafts.filter((d) => d.id !== draftId));
    toast.success('Draft order removed.');
  };

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

      const checkoutInput = {
        business_id: business.id,
        cashier_id: profile.id,
        customer_id: customerId || undefined,
        subtotal,
        discount: discountAmount,
        tax: taxAmount,
        total: grandTotal,
        payment_provider: paymentProvider as any,
        payment_method: paymentMethod,
        payment_status: payStatus,
        transaction_status: txStatus,
        payment_reference: payRef || `REF-${Date.now().toString().slice(-6)}`,
      };

      let transaction: any;

      if (!isOnline) {
        const queued = posSyncManager.enqueue(checkoutInput, itemsPayload);
        setOfflineQueueCount(posSyncManager.getQueue().length);
        transaction = {
          id: queued.id,
          receipt_number: `INV-OFFLINE-${Date.now().toString().slice(-4)}`,
          created_at: new Date().toISOString(),
          subtotal,
          discount: discountAmount,
          tax: taxAmount,
          total: grandTotal,
          payment_status: payStatus,
          transaction_status: txStatus,
          items: cartItems.map((ci) => ({
            product: ci.product,
            quantity: ci.quantity,
            total: ci.product.selling_price * ci.quantity,
          })),
        };
        toast.info('Network offline. Sale saved to Local Offline Queue! Will auto-sync when online.');
      } else {
        try {
          transaction = await posApi.checkout(checkoutInput, itemsPayload);
        } catch (err: any) {
          const queued = posSyncManager.enqueue(checkoutInput, itemsPayload);
          setOfflineQueueCount(posSyncManager.getQueue().length);
          transaction = {
            id: queued.id,
            receipt_number: `INV-OFFLINE-${Date.now().toString().slice(-4)}`,
            created_at: new Date().toISOString(),
            subtotal,
            discount: discountAmount,
            tax: taxAmount,
            total: grandTotal,
            payment_status: payStatus,
            transaction_status: txStatus,
            items: cartItems.map((ci) => ({
              product: ci.product,
              quantity: ci.quantity,
              total: ci.product.selling_price * ci.quantity,
            })),
          };
          toast.info('Network issue encountered. Sale saved to Local Offline Queue!');
        }
      }

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
            if (handler && typeof handler.openIframe === 'function') handler.openIframe();
            else if (handler && typeof handler.open === 'function') handler.open();
            return;
          }
        }
        setIsSubmittingCheckout(false);
      } catch (err: any) {
        toast.error(err.message || 'Paystack initialization failed');
        setIsSubmittingCheckout(false);
      }
      return;
    }

    // Default Cash/Card/Store Credit Flow
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

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col md:flex-row gap-6 relative">
      {/* Keyboard Shortcuts & Draft Modals */}
      <DraftOrdersModal
        isOpen={isDraftsModalOpen}
        onClose={() => setIsDraftsModalOpen(false)}
        drafts={drafts}
        onLoadDraft={handleLoadDraft}
        onDeleteDraft={handleDeleteDraft}
        currency={business?.currency || 'NGN'}
      />

      <SplitPaymentModal
        isOpen={isSplitPaymentOpen}
        onClose={() => setIsSplitPaymentOpen(false)}
        totalAmount={grandTotal}
        currency={business?.currency || 'NGN'}
        customer={selectedCustomer}
        onCompleteSplitPayment={() => {
          setIsSplitPaymentOpen(false);
          executeFinalCheckout('Success', 'Completed', `SPLIT-${Date.now()}`);
        }}
      />

      <KeyboardShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
      />

      {/* Left side: Catalog Lookup */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        {/* Search and Filters toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
          {!isOnline && (
            <div className="p-2.5 bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-pulse">
              <div className="flex items-center gap-2">
                <WifiOff className="w-4 h-4" />
                <span>Offline Mode Active • Sales will queue locally</span>
              </div>
              {offlineQueueCount > 0 && (
                <span className="bg-amber-700 px-2 py-0.5 rounded-md text-[11px]">
                  {offlineQueueCount} Queued Sale(s)
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Scan Barcode or Search Product... (Hotkey: F1)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-300 bg-white dark:border-slate-800 dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-slate-100"
              />
            </div>
            <button
              onClick={() => setIsShortcutsModalOpen(true)}
              className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="View Keyboard Hotkeys"
            >
              <Keyboard className="h-4 w-4" />
              <span className="hidden sm:inline">Hotkeys</span>
            </button>
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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDraftsModalOpen(true)}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              title="Saved Draft Carts"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Drafts ({drafts.length})</span>
            </button>
            <button
              onClick={handleSaveDraft}
              disabled={cartItems.length === 0}
              className="p-1 rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30"
              title="Save Current Cart as Draft (F3)"
            >
              <Save className="h-4 w-4" />
            </button>
            <button
              onClick={clearCart}
              disabled={cartItems.length === 0}
              className="text-xs font-semibold text-red-600 hover:text-red-500 disabled:opacity-50"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Customer select box & Loyalty indicator */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 space-y-2">
          <div className="flex gap-2 items-center">
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

          {selectedCustomer && (
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                <Award className="h-3.5 w-3.5" />
                {selectedCustomer.loyalty_points || 0} Loyalty Pts
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-semibold">
                Store Credit: ₦{(selectedCustomer.store_credit || 0).toLocaleString()}
              </span>
            </div>
          )}
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
            <span>Overall Order Discount (%) [F2]</span>
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

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsSplitPaymentOpen(true)}
              disabled={cartItems.length === 0}
              className="h-11 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <CreditCard className="h-4 w-4" />
              Split Tender
            </button>
            <Button
              onClick={() => setIsCheckoutOpen(true)}
              disabled={cartItems.length === 0}
              className="h-11 flex items-center justify-center gap-1.5"
            >
              <DollarSign className="h-4 w-4" />
              Pay Order
            </Button>
          </div>
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
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Payment Method</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'Cash', label: 'Cash' },
                { id: 'Card', label: 'Card POS' },
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

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            Secured by <span className="font-bold text-slate-600 dark:text-slate-300">paystack</span>
          </div>
        </div>
      </Dialog>

      {/* Thermal Receipt Dialog Modal */}
      <ThermalReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        transaction={completedTransaction}
        businessName={business?.name}
        businessAddress={business?.address}
        businessPhone={business?.phone}
        currency={business?.currency}
      />

      {/* Prompt Modal */}
      <PromptModal
        isOpen={promptModal.isOpen}
        onClose={() => setPromptModal((prev) => ({ ...prev, isOpen: false }))}
        onSubmit={promptModal.onSubmit}
        title={promptModal.title}
        message={promptModal.message}
        defaultValue={promptModal.defaultValue}
        inputType={promptModal.inputType}
      />

      {/* Clear Cart Confirm Modal */}
      <ConfirmModal
        isOpen={isClearCartConfirmOpen}
        onClose={() => setIsClearCartConfirmOpen(false)}
        onConfirm={clearCart}
        title="Clear Active Cart"
        message="Are you sure you want to clear all items from the active cart?"
        confirmText="Clear Cart"
        variant="danger"
      />
    </div>
  );
}
export default POSPage;
