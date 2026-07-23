-- Migration: RBAC Enforcement for Business Profile Editing, Taxes, and Attendance Visibility

-- 1. Enable RLS on Businesses table if not already enabled
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Drop old business policies if present
DROP POLICY IF EXISTS "businesses_select_policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_update_policy" ON public.businesses;
DROP POLICY IF EXISTS "businesses_delete_policy" ON public.businesses;

-- SELECT Policy: Users can view their assigned business
CREATE POLICY "businesses_select_policy"
ON public.businesses
FOR SELECT
USING (
  id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- UPDATE Policy: Restricted STRICTLY to Business Owners (Admins)
CREATE POLICY "businesses_update_policy"
ON public.businesses
FOR UPDATE
USING (
  id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'
  )
);

-- DELETE Policy: Restricted STRICTLY to Business Owners (Admins)
CREATE POLICY "businesses_delete_policy"
ON public.businesses
FOR DELETE
USING (
  id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'
  )
);


-- 2. Employee Shifts Attendance Policies
ALTER TABLE public.employee_shifts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "employee_shifts_all_policy" ON public.employee_shifts;
DROP POLICY IF EXISTS "employee_shifts_select_policy" ON public.employee_shifts;
DROP POLICY IF EXISTS "employee_shifts_insert_policy" ON public.employee_shifts;
DROP POLICY IF EXISTS "employee_shifts_update_policy" ON public.employee_shifts;

-- SELECT Policy: Admins & Managers can view shift attendance status for ALL staff; Cashiers view their own
CREATE POLICY "employee_shifts_select_policy"
ON public.employee_shifts
FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
  )
  OR user_id = auth.uid()
);

-- INSERT Policy: Staff can clock in their own shift
CREATE POLICY "employee_shifts_insert_policy"
ON public.employee_shifts
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
);

-- UPDATE Policy: Staff can clock out their own shift, or Admins can edit
CREATE POLICY "employee_shifts_update_policy"
ON public.employee_shifts
FOR UPDATE
USING (
  user_id = auth.uid()
  OR business_id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role = 'Admin'
  )
);


-- 3. Transactions Policy for "Who Sold What"
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "transactions_select_policy" ON public.transactions;

CREATE POLICY "transactions_select_policy"
ON public.transactions
FOR SELECT
USING (
  business_id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid()
  )
);
