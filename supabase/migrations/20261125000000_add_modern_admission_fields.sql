-- ==============================================================================
-- ADD MODERN ADMISSION & PAYMENT FIELDS TO ENROLLMENTS AND PROFILES
-- Captures full student profile, bank details, sender account info, and TxID
-- ==============================================================================

-- 1. Add fields to enrollments table
ALTER TABLE public.enrollments
  ADD COLUMN IF NOT EXISTS guardian_name TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Pakistan',
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth TEXT,
  ADD COLUMN IF NOT EXISTS education_level TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS sender_account_name TEXT,
  ADD COLUMN IF NOT EXISTS sender_account_number TEXT,
  ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS payment_date DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS student_notes TEXT;

-- 2. Add profile convenience fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS guardian_name TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS education_level TEXT;

-- 3. Create index for searching admissions by whatsapp, city, or payment method
CREATE INDEX IF NOT EXISTS idx_enrollments_whatsapp ON public.enrollments(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_enrollments_city ON public.enrollments(city);
CREATE INDEX IF NOT EXISTS idx_enrollments_payment_method ON public.enrollments(payment_method);
