
-- Add payment_method column to orders table if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;
