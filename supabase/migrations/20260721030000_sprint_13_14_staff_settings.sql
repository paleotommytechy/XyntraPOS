-- Migration for Sprint 13 (Staff & RBAC) and Sprint 14 (Settings)

-- 1. Extend Businesses table
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS tax_enabled BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS vat_number TEXT,
  ADD COLUMN IF NOT EXISTS receipt_header TEXT DEFAULT 'Thank you for shopping with us!',
  ADD COLUMN IF NOT EXISTS receipt_footer TEXT DEFAULT 'Goods sold in good condition cannot be returned after 7 days.',
  ADD COLUMN IF NOT EXISTS show_cashier_on_receipt BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 5;

-- 2. Extend Profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive'));

-- 3. Staff Invitations table
CREATE TABLE IF NOT EXISTS public.staff_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('Admin', 'Manager', 'Cashier')) DEFAULT 'Cashier',
    status TEXT NOT NULL CHECK (status IN ('Pending', 'Accepted', 'Cancelled')) DEFAULT 'Pending',
    token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days')
);

-- Enable RLS on staff_invitations
ALTER TABLE public.staff_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for staff_invitations
CREATE POLICY "Users can view staff invitations for their business"
ON public.staff_invitations
FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can insert staff invitations"
ON public.staff_invitations
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'
  )
);

CREATE POLICY "Admins can update staff invitations"
ON public.staff_invitations
FOR UPDATE
USING (
  business_id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'
  )
);
