-- -------------------------------------------------------------
-- SECURITY DEFINER HELPERS
-- -------------------------------------------------------------

-- Lookup user business_id bypassing RLS
CREATE OR REPLACE FUNCTION public.get_user_business_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT business_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Lookup user role bypassing RLS
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (SELECT role FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -------------------------------------------------------------
-- POLICIES CORRECTION
-- -------------------------------------------------------------

-- Drop profiles select policy
DROP POLICY IF EXISTS profiles_select_policy ON public.profiles;
CREATE POLICY profiles_select_policy ON public.profiles
    FOR SELECT USING (id = auth.uid() OR business_id = public.get_user_business_id());

-- Drop businesses policies
DROP POLICY IF EXISTS businesses_select_policy ON public.businesses;
CREATE POLICY businesses_select_policy ON public.businesses
    FOR SELECT USING (id = public.get_user_business_id());

DROP POLICY IF EXISTS businesses_update_policy ON public.businesses;
CREATE POLICY businesses_update_policy ON public.businesses
    FOR UPDATE USING (id = public.get_user_business_id() AND public.get_user_role() = 'Admin');

-- Drop stores policies
DROP POLICY IF EXISTS stores_all_policy ON public.stores;
CREATE POLICY stores_all_policy ON public.stores
    FOR ALL USING (business_id = public.get_user_business_id());

-- Drop categories policies
DROP POLICY IF EXISTS categories_all_policy ON public.categories;
CREATE POLICY categories_all_policy ON public.categories
    FOR ALL USING (business_id = public.get_user_business_id());

-- Drop products policies
DROP POLICY IF EXISTS products_all_policy ON public.products;
CREATE POLICY products_all_policy ON public.products
    FOR ALL USING (business_id = public.get_user_business_id());

-- Drop inventory logs policies
DROP POLICY IF EXISTS inventory_logs_select_policy ON public.inventory_logs;
CREATE POLICY inventory_logs_select_policy ON public.inventory_logs
    FOR SELECT USING (business_id = public.get_user_business_id());

-- Drop customers policies
DROP POLICY IF EXISTS customers_all_policy ON public.customers;
CREATE POLICY customers_all_policy ON public.customers
    FOR ALL USING (business_id = public.get_user_business_id());

-- Drop transactions policies
DROP POLICY IF EXISTS transactions_all_policy ON public.transactions;
CREATE POLICY transactions_all_policy ON public.transactions
    FOR ALL USING (business_id = public.get_user_business_id());

-- Drop transaction items policies
DROP POLICY IF EXISTS transaction_items_all_policy ON public.transaction_items;
CREATE POLICY transaction_items_all_policy ON public.transaction_items
    FOR ALL USING (
        transaction_id IN (
            SELECT id FROM public.transactions
            WHERE business_id = public.get_user_business_id()
        )
    );

-- Drop payments policies
DROP POLICY IF EXISTS payments_all_policy ON public.payments;
CREATE POLICY payments_all_policy ON public.payments
    FOR ALL USING (business_id = public.get_user_business_id());

-- Drop business settings policies
DROP POLICY IF EXISTS settings_all_policy ON public.business_settings;
CREATE POLICY settings_all_policy ON public.business_settings
    FOR ALL USING (business_id = public.get_user_business_id());

-- Drop notifications policies
DROP POLICY IF EXISTS notifications_all_policy ON public.notifications;
CREATE POLICY notifications_all_policy ON public.notifications
    FOR ALL USING (business_id = public.get_user_business_id());

-- Drop audit logs policies
DROP POLICY IF EXISTS audit_logs_select_policy ON public.audit_logs;
CREATE POLICY audit_logs_select_policy ON public.audit_logs
    FOR SELECT USING (business_id = public.get_user_business_id());
