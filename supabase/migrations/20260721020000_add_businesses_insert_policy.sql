-- -------------------------------------------------------------
-- SECURITY DEFINER HELPERS (Ensuring they are present)
-- -------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT business_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- ENABLE RLS ON ALL TABLES
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

-- -------------------------------------------------------------
-- CLEANUP EXISTING POLICIES
-- -------------------------------------------------------------

-- Businesses
DROP POLICY IF EXISTS businesses_select_policy ON public.businesses;
DROP POLICY IF EXISTS businesses_insert_policy ON public.businesses;
DROP POLICY IF EXISTS businesses_update_policy ON public.businesses;

-- Profiles
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
DROP POLICY IF EXISTS profiles_update_policy ON public.profiles;

-- Stores
DROP POLICY IF EXISTS stores_all_policy ON public.stores;

-- Categories
DROP POLICY IF EXISTS categories_all_policy ON public.categories;

-- Products
DROP POLICY IF EXISTS products_all_policy ON public.products;

-- Inventory Logs
DROP POLICY IF EXISTS inventory_logs_select_policy ON public.inventory_logs;
DROP POLICY IF EXISTS inventory_logs_insert_policy ON public.inventory_logs;

-- Customers
DROP POLICY IF EXISTS customers_all_policy ON public.customers;

-- Transactions
DROP POLICY IF EXISTS transactions_all_policy ON public.transactions;

-- Transaction Items
DROP POLICY IF EXISTS transaction_items_all_policy ON public.transaction_items;

-- Payments
DROP POLICY IF EXISTS payments_all_policy ON public.payments;

-- Business Settings
DROP POLICY IF EXISTS settings_all_policy ON public.business_settings;

-- Notifications
DROP POLICY IF EXISTS notifications_all_policy ON public.notifications;

-- Audit Logs
DROP POLICY IF EXISTS audit_logs_select_policy ON public.audit_logs;
DROP POLICY IF EXISTS audit_logs_insert_policy ON public.audit_logs;


-- -------------------------------------------------------------
-- CREATE RE-DESIGNED AND ROBUST RLS POLICIES
-- -------------------------------------------------------------

-- 1. Businesses
CREATE POLICY businesses_insert_policy ON public.businesses
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY businesses_select_policy ON public.businesses
    FOR SELECT USING (
        id = public.get_user_business_id()
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND business_id IS NULL
        )
    );

CREATE POLICY businesses_update_policy ON public.businesses
    FOR UPDATE USING (
        id = public.get_user_business_id() 
        AND public.get_user_role() = 'Admin'
    );

-- 2. Profiles
CREATE POLICY profiles_select_policy ON public.profiles
    FOR SELECT USING (
        id = auth.uid() 
        OR business_id = public.get_user_business_id()
    );

CREATE POLICY profiles_update_policy ON public.profiles
    FOR UPDATE USING (
        id = auth.uid()
        OR (
            business_id = public.get_user_business_id()
            AND public.get_user_role() = 'Admin'
        )
    );

-- 3. Stores
CREATE POLICY stores_all_policy ON public.stores
    FOR ALL USING (business_id = public.get_user_business_id());

-- 4. Categories
CREATE POLICY categories_all_policy ON public.categories
    FOR ALL USING (business_id = public.get_user_business_id());

-- 5. Products
CREATE POLICY products_all_policy ON public.products
    FOR ALL USING (business_id = public.get_user_business_id());

-- 6. Inventory Logs (ReadOnly for compliance / Immutable history)
CREATE POLICY inventory_logs_select_policy ON public.inventory_logs
    FOR SELECT USING (business_id = public.get_user_business_id());

CREATE POLICY inventory_logs_insert_policy ON public.inventory_logs
    FOR INSERT WITH CHECK (business_id = public.get_user_business_id());

-- 7. Customers
CREATE POLICY customers_all_policy ON public.customers
    FOR ALL USING (business_id = public.get_user_business_id());

-- 8. Transactions (Immutable history - no UPDATE/DELETE)
CREATE POLICY transactions_all_policy ON public.transactions
    FOR SELECT USING (business_id = public.get_user_business_id());

CREATE POLICY transactions_insert_policy ON public.transactions
    FOR INSERT WITH CHECK (business_id = public.get_user_business_id());

-- 9. Transaction Items (Immutable - no UPDATE/DELETE)
CREATE POLICY transaction_items_select_policy ON public.transaction_items
    FOR SELECT USING (
        transaction_id IN (
            SELECT id FROM public.transactions
            WHERE business_id = public.get_user_business_id()
        )
    );

CREATE POLICY transaction_items_insert_policy ON public.transaction_items
    FOR INSERT WITH CHECK (
        transaction_id IN (
            SELECT id FROM public.transactions
            WHERE business_id = public.get_user_business_id()
        )
    );

-- 10. Payments (Immutable - no UPDATE/DELETE)
CREATE POLICY payments_select_policy ON public.payments
    FOR SELECT USING (business_id = public.get_user_business_id());

CREATE POLICY payments_insert_policy ON public.payments
    FOR INSERT WITH CHECK (business_id = public.get_user_business_id());

-- 11. Business Settings
CREATE POLICY settings_all_policy ON public.business_settings
    FOR ALL USING (business_id = public.get_user_business_id());

-- 12. Notifications
CREATE POLICY notifications_all_policy ON public.notifications
    FOR ALL USING (business_id = public.get_user_business_id());

-- 13. Audit Logs (Immutable - no UPDATE/DELETE)
CREATE POLICY audit_logs_select_policy ON public.audit_logs
    FOR SELECT USING (business_id = public.get_user_business_id());

CREATE POLICY audit_logs_insert_policy ON public.audit_logs
    FOR INSERT WITH CHECK (business_id = public.get_user_business_id());
