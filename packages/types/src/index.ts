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
  status?: 'Active' | 'Inactive' | 'Pending Approval';
  created_at: string;
}

export interface StaffInvitation {
  id: string;
  business_id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'Admin' | 'Manager' | 'Cashier';
  status: 'Pending' | 'Awaiting Approval' | 'Accepted' | 'Cancelled' | 'Rejected';
  token?: string;
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
  loyalty_points?: number;
  store_credit?: number;
  tags?: string[];
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
  customer?: any;
  cashier?: any;
  items?: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total: number;
  product?: Product;
}

export interface Payment {
  id: string;
  transaction_id: string;
  business_id: string;
  provider: 'Paystack' | 'Cash' | 'Transfer' | 'Card' | 'Store Credit';
  payment_method: string;
  amount: number;
  currency: string;
  payment_reference: string;
  provider_reference?: string;
  status: 'Pending' | 'Success' | 'Failed' | 'Refunded';
  paid_at?: string;
}

// Phase 2 Extensions
export interface DraftOrder {
  id: string;
  business_id: string;
  customer_id?: string | null;
  title: string;
  items: {
    product: Product;
    quantity: number;
    discount: number;
  }[];
  discount: number;
  subtotal: number;
  total: number;
  created_by?: string;
  created_at: string;
  customer?: Customer;
}

export interface InventoryTransfer {
  id: string;
  business_id: string;
  product_id: string;
  from_location: string;
  to_location: string;
  quantity: number;
  status: 'Pending' | 'Completed' | 'Cancelled';
  notes?: string;
  created_by?: string;
  created_at: string;
  product?: Product;
}

export interface ReturnRecord {
  id: string;
  business_id: string;
  transaction_id: string;
  customer_id?: string;
  refund_amount: number;
  refund_method: 'Store Credit' | 'Cash' | 'Card' | 'Bank Transfer';
  reason: string;
  restock_inventory: boolean;
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
  }[];
  processed_by?: string;
  created_at: string;
  customer?: Customer;
}

export interface EmployeeShift {
  id: string;
  business_id: string;
  user_id: string;
  clock_in: string;
  clock_out?: string | null;
  total_hours?: number;
  notes?: string;
  created_at: string;
  profile?: UserProfile;
}

export interface AuditLogItem {
  id: string;
  business_id: string;
  user_id?: string;
  action: string;
  table_name: string;
  record_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  created_at: string;
  profile?: UserProfile;
}

export interface NotificationItem {
  id: string;
  business_id: string;
  user_id?: string;
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  is_read: boolean;
  created_at: string;
}

export interface StockValuation {
  totalItems: number;
  totalQuantity: number;
  costValue: number;
  retailValue: number;
  potentialProfit: number;
  marginPercentage: number;
}
