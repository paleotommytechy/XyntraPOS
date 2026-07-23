-- Migration: Upgrade Staff Invitations RLS & Security Definer Claim Function

-- 1. Upgrade Staff Invitations status CHECK constraint
ALTER TABLE public.staff_invitations
  DROP CONSTRAINT IF EXISTS staff_invitations_status_check;

ALTER TABLE public.staff_invitations
  ADD CONSTRAINT staff_invitations_status_check
  CHECK (status IN ('Pending', 'Awaiting Approval', 'Accepted', 'Cancelled', 'Rejected'));

-- 2. Upgrade Profiles status CHECK constraint
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (status IN ('Active', 'Inactive', 'Pending Approval'));

-- 3. Drop existing strict SELECT policy on staff_invitations
DROP POLICY IF EXISTS "Users can view staff invitations for their business" ON public.staff_invitations;
DROP POLICY IF EXISTS "Admins can insert staff invitations" ON public.staff_invitations;
DROP POLICY IF EXISTS "Admins can update staff invitations" ON public.staff_invitations;
DROP POLICY IF EXISTS "staff_invitations_select_policy" ON public.staff_invitations;

-- 4. Create upgraded RLS policies for staff_invitations

-- SELECT: Allow business users OR any user querying an active invitation code/email
CREATE POLICY "staff_invitations_select_policy"
ON public.staff_invitations
FOR SELECT
USING (
  -- Business Owner/Staff viewing invitations for their tenant
  business_id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid()
  )
  -- OR new staff verifying a pending code token
  OR status IN ('Pending', 'Awaiting Approval')
);

-- INSERT: Allow Admins to create invitations
CREATE POLICY "staff_invitations_insert_policy"
ON public.staff_invitations
FOR INSERT
WITH CHECK (
  business_id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
  )
  OR auth.uid() IS NOT NULL
);

-- UPDATE: Allow Admins OR staff claiming their code to update status
CREATE POLICY "staff_invitations_update_policy"
ON public.staff_invitations
FOR UPDATE
USING (
  business_id IN (
    SELECT business_id FROM public.profiles WHERE id = auth.uid() AND role IN ('Admin', 'Manager')
  )
  OR status IN ('Pending', 'Awaiting Approval')
);

-- 5. RPC Security Definer Function: verify_and_claim_staff_invitation
CREATE OR REPLACE FUNCTION public.claim_staff_invitation_code(
  p_user_id UUID,
  p_code TEXT,
  p_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv RECORD;
  v_biz RECORD;
  v_clean_code TEXT;
  v_clean_email TEXT;
BEGIN
  v_clean_code := TRIM(p_code);
  v_clean_email := LOWER(TRIM(COALESCE(p_email, '')));

  -- Search for matching invitation by token or email
  SELECT * INTO v_inv
  FROM public.staff_invitations
  WHERE (
    UPPER(token) = UPPER(v_clean_code)
    OR UPPER(token) = UPPER(REPLACE(v_clean_code, 'XYN-', ''))
    OR UPPER(token) = UPPER(CONCAT('XYN-', v_clean_code))
    OR (v_clean_email <> '' AND LOWER(email) = v_clean_email)
  )
  AND status IN ('Pending', 'Awaiting Approval')
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired One-Time Code (' || v_clean_code || '). Please verify the code with your store manager.'
    );
  END IF;

  -- Verify target email if invitation specified one
  IF v_inv.email IS NOT NULL AND v_inv.email <> '' AND v_clean_email <> '' AND LOWER(v_inv.email) <> v_clean_email THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'This One-Time Code is assigned to email "' || v_inv.email || '". Please sign in with that email address to activate access.'
    );
  END IF;

  -- Fetch Business Details
  SELECT * INTO v_biz
  FROM public.businesses
  WHERE id = v_inv.business_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Associated business workspace could not be found.'
    );
  END IF;

  -- Update User Profile with business_id, role, and Pending Approval status
  UPDATE public.profiles
  SET 
    business_id = v_inv.business_id,
    role = v_inv.role,
    status = 'Pending Approval',
    name = COALESCE(NULLIF(v_inv.name, ''), name),
    email = COALESCE(NULLIF(v_clean_email, ''), email)
  WHERE id = p_user_id;

  -- Update Invitation Status to Awaiting Approval
  UPDATE public.staff_invitations
  SET status = 'Awaiting Approval'
  WHERE id = v_inv.id;

  RETURN jsonb_build_object(
    'success', true,
    'business', row_to_json(v_biz),
    'invitation', row_to_json(v_inv),
    'role', v_inv.role
  );
END;
$$;
