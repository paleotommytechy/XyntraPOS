-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -------------------------------------------------------------
-- UPDATED_AT TRIGGER FUNCTION
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- -------------------------------------------------------------
-- CORE TABLES
-- -------------------------------------------------------------

-- Businesses Table
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo TEXT,
    email TEXT,
    phone TEXT,
    currency TEXT NOT NULL DEFAULT 'NGN',
    timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
    tax_rate NUMERIC NOT NULL DEFAULT 0.0,
    address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_businesses_updated_at
    BEFORE UPDATE ON public.businesses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Profiles Table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY, -- References auth.users(id)
    name TEXT NOT NULL,
    avatar TEXT,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Manager', 'Cashier')) DEFAULT 'Cashier',
    business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stores Table (Multi-branch support)
CREATE TABLE public.stores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_stores_updated_at
    BEFORE UPDATE ON public.stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------------
-- PRODUCT MODULE
-- -------------------------------------------------------------

-- Categories Table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON public.categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Products Table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    sku TEXT NOT NULL,
    barcode TEXT,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    cost_price NUMERIC NOT NULL DEFAULT 0.0 CHECK (cost_price >= 0),
    selling_price NUMERIC NOT NULL DEFAULT 0.0 CHECK (selling_price >= 0),
    stock_quantity INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
    minimum_stock INTEGER NOT NULL DEFAULT 0 CHECK (minimum_stock >= 0),
    tax_rate NUMERIC NOT NULL DEFAULT 0.0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    UNIQUE (business_id, sku),
    UNIQUE (business_id, barcode)
);

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------------
-- INVENTORY MODULE
-- -------------------------------------------------------------

-- Inventory Logs Table
CREATE TABLE public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('STOCK_IN', 'STOCK_OUT', 'SALE', 'RETURN', 'ADJUSTMENT')),
    quantity INTEGER NOT NULL,
    previous_stock INTEGER NOT NULL,
    new_stock INTEGER NOT NULL,
    reason TEXT,
    reference_id UUID, -- References transaction_id, PO_id, etc.
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- CUSTOMER MODULE
-- -------------------------------------------------------------

-- Customers Table
CREATE TABLE public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON public.customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -------------------------------------------------------------
-- SALES MODULE
-- -------------------------------------------------------------

-- Transactions Table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    cashier_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    subtotal NUMERIC NOT NULL CHECK (subtotal >= 0),
    discount NUMERIC NOT NULL DEFAULT 0.0 CHECK (discount >= 0),
    tax NUMERIC NOT NULL DEFAULT 0.0 CHECK (tax >= 0),
    total NUMERIC NOT NULL CHECK (total >= 0),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('Pending', 'Success', 'Failed', 'Refunded')),
    transaction_status TEXT NOT NULL CHECK (transaction_status IN ('Pending', 'Completed', 'Cancelled', 'Refunded')),
    receipt_number TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (business_id, receipt_number)
);

-- Transaction Items Table
CREATE TABLE public.transaction_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    discount NUMERIC NOT NULL DEFAULT 0.0 CHECK (discount >= 0),
    total NUMERIC NOT NULL CHECK (total >= 0)
);

-- -------------------------------------------------------------
-- PAYMENTS MODULE
-- -------------------------------------------------------------

-- Payments Table
CREATE TABLE public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('Paystack', 'Cash', 'Transfer', 'Card')),
    payment_method TEXT NOT NULL,
    amount NUMERIC NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL DEFAULT 'NGN',
    payment_reference TEXT NOT NULL,
    provider_reference TEXT,
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Success', 'Failed', 'Refunded')),
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- SETTINGS & UTILITY TABLES
-- -------------------------------------------------------------

-- Business Settings Table
CREATE TABLE public.business_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
    receipt_footer TEXT,
    tax_enabled BOOLEAN NOT NULL DEFAULT true,
    currency TEXT NOT NULL DEFAULT 'NGN',
    timezone TEXT NOT NULL DEFAULT 'Africa/Lagos',
    printer_enabled BOOLEAN NOT NULL DEFAULT false,
    email_receipts BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER update_business_settings_updated_at
    BEFORE UPDATE ON public.business_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Notifications Table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'INFO',
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Audit Logs Table
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -------------------------------------------------------------
-- TRIGGERS FOR BUSINESS LOGIC
-- -------------------------------------------------------------

-- Trigger function to automatically create profile for a new user in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, role, phone, avatar)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
        'Admin', -- default role for registering user
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'avatar'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Link to auth.users trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to decrease product stock on successful transaction item insertion
CREATE OR REPLACE FUNCTION public.handle_transaction_item_stock()
RETURNS TRIGGER AS $$
DECLARE
    current_stock_val INTEGER;
    trans_business_id UUID;
BEGIN
    -- Get current stock level
    SELECT stock_quantity INTO current_stock_val
    FROM public.products
    WHERE id = NEW.product_id;

    -- Get transaction business_id
    SELECT business_id INTO trans_business_id
    FROM public.transactions
    WHERE id = NEW.transaction_id;

    -- Deduct stock
    UPDATE public.products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;

    -- Write to inventory log
    INSERT INTO public.inventory_logs (
        business_id,
        product_id,
        movement_type,
        quantity,
        previous_stock,
        new_stock,
        reason,
        reference_id
    ) VALUES (
        trans_business_id,
        NEW.product_id,
        'SALE',
        NEW.quantity,
        current_stock_val,
        current_stock_val - NEW.quantity,
        'POS Transaction Item',
        NEW.transaction_id
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_transaction_item_created
    AFTER INSERT ON public.transaction_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_item_stock();

-- -------------------------------------------------------------
-- INDEXES FOR PERFORMANCE
-- -------------------------------------------------------------
CREATE INDEX idx_profiles_business_id ON public.profiles(business_id);
CREATE INDEX idx_stores_business_id ON public.stores(business_id);
CREATE INDEX idx_categories_business_id ON public.categories(business_id);
CREATE INDEX idx_products_business_id ON public.products(business_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_barcode ON public.products(barcode);
CREATE INDEX idx_products_sku ON public.products(sku);
CREATE INDEX idx_inventory_logs_business_id ON public.inventory_logs(business_id);
CREATE INDEX idx_inventory_logs_product_id ON public.inventory_logs(product_id);
CREATE INDEX idx_customers_business_id ON public.customers(business_id);
CREATE INDEX idx_transactions_business_id ON public.transactions(business_id);
CREATE INDEX idx_transactions_customer_id ON public.transactions(customer_id);
CREATE INDEX idx_transactions_receipt_number ON public.transactions(receipt_number);
CREATE INDEX idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_product_id ON public.transaction_items(product_id);
CREATE INDEX idx_payments_business_id ON public.payments(business_id);
CREATE INDEX idx_payments_transaction_id ON public.payments(transaction_id);
CREATE INDEX idx_payments_reference ON public.payments(payment_reference);
CREATE INDEX idx_business_settings_business_id ON public.business_settings(business_id);
CREATE INDEX idx_notifications_business_id ON public.notifications(business_id);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_audit_logs_business_id ON public.audit_logs(business_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);

-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS)
-- -------------------------------------------------------------
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper SQL policy functions/criteria
-- Standard policy: match business_id
-- We bypass RLS for Admins / service roles where needed, but standard queries require matching business_id.

-- Profiles policy: Users can see profiles in their own business, and edit their own profile
CREATE POLICY profiles_select_policy ON public.profiles
    FOR SELECT USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY profiles_update_policy ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- Businesses policy: Profiles can see the business details they are linked to
CREATE POLICY businesses_select_policy ON public.businesses
    FOR SELECT USING (id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY businesses_update_policy ON public.businesses
    FOR UPDATE USING (id = (SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'));

-- Generic template for business-scoped tables (Stores, Categories, Products, Customers, Transactions, etc.)
CREATE POLICY stores_all_policy ON public.stores
    FOR ALL USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY categories_all_policy ON public.categories
    FOR ALL USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY products_all_policy ON public.products
    FOR ALL USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY inventory_logs_select_policy ON public.inventory_logs
    FOR SELECT USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY customers_all_policy ON public.customers
    FOR ALL USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY transactions_all_policy ON public.transactions
    FOR ALL USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

-- Transaction items are fetched if the transaction belongs to the business
CREATE POLICY transaction_items_all_policy ON public.transaction_items
    FOR ALL USING (
        transaction_id IN (
            SELECT id FROM public.transactions
            WHERE business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid())
        )
    );

CREATE POLICY payments_all_policy ON public.payments
    FOR ALL USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY settings_all_policy ON public.business_settings
    FOR ALL USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY notifications_all_policy ON public.notifications
    FOR ALL USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY audit_logs_select_policy ON public.audit_logs
    FOR SELECT USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));
