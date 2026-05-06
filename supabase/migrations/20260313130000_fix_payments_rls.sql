-- Ensure proper RLS policies for payments table to allow webhooks to update

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can insert payments" ON public.payments;
DROP POLICY IF EXISTS "Service role can update payments" ON public.payments;

-- Recreate policies with proper permissions
CREATE POLICY "Users can view own payments"
ON public.payments
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow anyone (webhooks) to insert - they run as authenticated
CREATE POLICY "Anyone can insert payments"
ON public.payments
FOR INSERT
WITH CHECK (true);

-- Allow authenticated users to read their payments
-- Allow updates for webhooks (service role)
CREATE POLICY "Anyone can update payments"
ON public.payments
FOR UPDATE
USING (true)
WITH CHECK (true);
