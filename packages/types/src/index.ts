export interface Business {
  id: string;
  name: string;
  logo?: string;
  email?: string;
  phone?: string;
  currency: string;
  timezone: string;
  tax_rate: number;
  tax_enabled?: boolean;
  vat_number?: string;
  address?: string;
  receipt_header?: string;
  receipt_footer?: string;
  show_cashier_on_receipt?: boolean;
  low_stock_threshold?: number;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  phone?: string;
  role: 'Admin' | 'Manager' | 'Cashier';
  business_id: string;
  status?: 'Active' | 'Inactive';
  created_at: string;
}

export interface StaffInvitation {
  id: string;
  business_id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Cashier';
  status: 'Pending' | 'Accepted';
  created_at: string;
}

export interface Category {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  deleted_at?: string;
}

export interface Product {
  id: string;
  business_id: string;
  category_id?: string;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  image_url?: string;
  cost_price: number;
  selling_price: number;
  stock_quantity: number;
  minimum_stock: number;
  tax_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Customer {
  id: string;
  business_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  business_id: string;
  store_id: string;
  customer_id?: string;
  cashier_id: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_status: 'Pending' | 'Success' | 'Failed' | 'Refunded';
  transaction_status: 'Pending' | 'Completed' | 'Cancelled' | 'Refunded';
  receipt_number: string;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
}

export interface Payment {
  id: string;
  transaction_id: string;
  business_id: string;
  provider: 'Paystack' | 'Cash' | 'Transfer' | 'Card';
  payment_method: string;
  amount: number;
  currency: string;
  payment_reference: string;
  provider_reference?: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Refunded';
  paid_at?: string;
}
