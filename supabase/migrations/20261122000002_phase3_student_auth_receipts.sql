-- ==============================================================================
-- PHASE 3 MIGRATION: STUDENT AUTHENTICATION & RECEIPT STORAGE SETUP
-- ==============================================================================

-- 1. Add phone / WhatsApp column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone TEXT;

-- 2. Update handle_new_user() trigger to save phone from user metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'student'::user_role)
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = EXCLUDED.phone,
    full_name = EXCLUDED.full_name;
  RETURN NEW;
END;
$$;

-- 3. Ensure 'receipts' private storage bucket exists (as well as 'payment-receipts')
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Students can upload payment receipt to their own folder: receipts/<auth.uid()>/...
CREATE POLICY "Students can upload receipts to receipts bucket"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'receipts' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage Policy: Students can view their own receipt in receipts bucket
CREATE POLICY "Students can view own receipts in receipts bucket"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'receipts' AND
    (
      (storage.foldername(name))[1] = auth.uid()::text OR
      public.is_admin()
    )
  );

-- Storage Policy: Admins have full access to receipts bucket
CREATE POLICY "Admins have full access to receipts bucket"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'receipts' AND
    public.is_admin()
  );
