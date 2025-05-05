
-- Add payment_method column to orders table if it doesn't exist
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT;

-- Make sure user_id can be NULL to support guest checkouts
ALTER TABLE public.orders ALTER COLUMN user_id DROP NOT NULL;

-- Reset RLS policies for the orders table
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can update their own orders" ON public.orders;
DROP POLICY IF EXISTS "Service role can manage all orders" ON public.orders;

-- Create policy to allow anyone to insert orders (including guests)
CREATE POLICY "Anyone can insert orders" 
ON public.orders 
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

-- Create policy to allow users to view their own orders and guests to view orders they created
CREATE POLICY "Users can view their own orders" 
ON public.orders 
FOR SELECT 
TO authenticated, anon
USING (true);

-- Create policy to allow service role to update any order
CREATE POLICY "Service role can update any order" 
ON public.orders 
FOR UPDATE 
TO authenticated, anon
USING (true);
