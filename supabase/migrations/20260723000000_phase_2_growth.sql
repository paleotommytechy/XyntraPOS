-- Phase 2: Business Growth Migration SQL

-- 1. Extend Customers table with loyalty, store credit, and tags
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS loyalty_points INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS store_credit NUMERIC NOT NULL DEFAULT 0.0 CHECK (store_credit >= 0),
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- 2. Draft Orders Table (Saved Carts)
CREATE TABLE IF NOT EXISTS public.draft_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    items JSONB NOT NULL, -- Array of cart items
    discount NUMERIC NOT NULL DEFAULT 0.0,
    subtotal NUMERIC NOT NULL DEFAULT 0.0,
    total NUMERIC NOT NULL DEFAULT 0.0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Inventory Transfers Table
CREATE TABLE IF NOT EXISTS public.inventory_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    from_location TEXT NOT NULL,
    to_location TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Completed', 'Cancelled')) DEFAULT 'Pending',
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Returns & Refunds Table
CREATE TABLE IF NOT EXISTS public.returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    refund_amount NUMERIC NOT NULL CHECK (refund_amount >= 0),
    refund_method TEXT NOT NULL CHECK (refund_method IN ('Store Credit', 'Cash', 'Card', 'Bank Transfer')),
    reason TEXT NOT NULL,
    restock_inventory BOOLEAN NOT NULL DEFAULT true,
    items JSONB NOT NULL, -- Returned items array
    processed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Employee Shifts Table (Clock-in / Clock-out)
CREATE TABLE IF NOT EXISTS public.employee_shifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
    clock_out TIMESTAMPTZ,
    total_hours NUMERIC DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_draft_orders_business ON public.draft_orders(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_business ON public.inventory_transfers(business_id);
CREATE INDEX IF NOT EXISTS idx_returns_business ON public.returns(business_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_business ON public.employee_shifts(business_id);
CREATE INDEX IF NOT EXISTS idx_employee_shifts_user ON public.employee_shifts(user_id);

-- RLS Policies
ALTER TABLE public.draft_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY draft_orders_all_policy ON public.draft_orders
    FOR ALL USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY inventory_transfers_all_policy ON public.inventory_transfers
    FOR ALL USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY returns_all_policy ON public.returns
    FOR ALL USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY employee_shifts_all_policy ON public.employee_shifts
    FOR ALL USING (business_id = (SELECT business_id FROM public.profiles WHERE id = auth.uid()));
