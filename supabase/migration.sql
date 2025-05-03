
-- Add payment_method column to orders table if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Make sure user_id can be NULL to support guest checkouts
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;
