-- Create poupeja_customers table
CREATE TABLE IF NOT EXISTS public.poupeja_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.poupeja_customers ENABLE ROW LEVEL SECURITY;

-- Create policies (drop if exists first)
DROP POLICY IF EXISTS "Users can view own customer data" ON public.poupeja_customers;
CREATE POLICY "Users can view own customer data" ON public.poupeja_customers
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage customers" ON public.poupeja_customers;
CREATE POLICY "Service role can manage customers" ON public.poupeja_customers
  FOR ALL USING (true);

-- Create index for performance (only if not exists)
CREATE INDEX IF NOT EXISTS idx_poupeja_customers_user_id ON public.poupeja_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_poupeja_customers_stripe_customer_id ON public.poupeja_customers(stripe_customer_id);