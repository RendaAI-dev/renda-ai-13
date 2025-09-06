-- Recriar as tabelas que foram apagadas

-- 1.1 Tabela de usuários (se não existir)
CREATE TABLE IF NOT EXISTS public.poupeja_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  phone text,
  profile_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.2 Tabela de categorias (se não existir)
CREATE TABLE IF NOT EXISTS public.poupeja_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  color text NOT NULL DEFAULT '#9E9E9E',
  icon text DEFAULT 'circle',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 1.3 Tabela de metas/objetivos (se não existir)
CREATE TABLE IF NOT EXISTS public.poupeja_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric DEFAULT 0,
  color text DEFAULT '#3B82F6',
  start_date date NOT NULL,
  end_date date,
  deadline date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.4 Tabela de transações (se não existir)
CREATE TABLE IF NOT EXISTS public.poupeja_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric NOT NULL,
  category_id uuid REFERENCES public.poupeja_categories(id),
  description text,
  date date NOT NULL,
  goal_id uuid REFERENCES public.poupeja_goals(id),
  created_at timestamptz DEFAULT now()
);

-- 1.5 Tabela de transações agendadas (se não existir)
CREATE TABLE IF NOT EXISTS public.poupeja_scheduled_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  amount numeric NOT NULL,
  category_id uuid REFERENCES public.poupeja_categories(id),
  description text,
  scheduled_date date NOT NULL,
  recurrence text,
  status text DEFAULT 'pending',
  paid_amount numeric,
  paid_date date,
  goal_id uuid REFERENCES public.poupeja_goals(id),
  next_execution_date date,
  last_execution_date date,
  created_at timestamptz DEFAULT now()
);

-- 1.6 Tabela de assinaturas (se não existir)
CREATE TABLE IF NOT EXISTS public.poupeja_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text NOT NULL,
  plan_type text NOT NULL,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS em todas as tabelas (se não estiver habilitado)
ALTER TABLE IF EXISTS public.poupeja_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.poupeja_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.poupeja_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.poupeja_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.poupeja_scheduled_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.poupeja_subscriptions ENABLE ROW LEVEL SECURITY;

-- Limpar categorias padrão existentes para evitar duplicações
DELETE FROM public.poupeja_categories WHERE user_id IS NULL AND is_default = true;

-- Inserir categorias padrão de despesas
INSERT INTO public.poupeja_categories (name, type, color, icon, is_default)
VALUES 
  ('Alimentação', 'expense', '#E57373', 'utensils', true),
  ('Transporte', 'expense', '#64B5F6', 'car', true),
  ('Moradia', 'expense', '#81C784', 'home', true),
  ('Saúde', 'expense', '#FF8A65', 'heart', true),
  ('Educação', 'expense', '#9575CD', 'book', true),
  ('Lazer', 'expense', '#F06292', 'gamepad-2', true),
  ('Outros', 'expense', '#9E9E9E', 'circle', true);

-- Inserir categorias padrão de receitas
INSERT INTO public.poupeja_categories (name, type, color, icon, is_default)
VALUES 
  ('Salário', 'income', '#4CAF50', 'banknote', true),
  ('Freelance', 'income', '#2196F3', 'briefcase', true),
  ('Investimentos', 'income', '#FF9800', 'trending-up', true),
  ('Outros', 'income', '#9E9E9E', 'circle', true);


-- Adicionar após as outras definições de tabela

-- 1.7 Tabela de clientes Stripe (se não existir)
CREATE TABLE IF NOT EXISTS public.poupeja_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id text NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Adicionar à lista de tabelas com RLS habilitado
ALTER TABLE IF EXISTS public.poupeja_customers ENABLE ROW LEVEL SECURITY;

-- Adicionar políticas RLS para poupeja_customers
-- Nota: PostgreSQL não suporta 'IF NOT EXISTS' para políticas, então vamos usar DROP POLICY IF EXISTS antes
DROP POLICY IF EXISTS "Users can view their own customer data" ON public.poupeja_customers;
CREATE POLICY "Users can view their own customer data" ON public.poupeja_customers
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own customer data" ON public.poupeja_customers;
CREATE POLICY "Users can insert their own customer data" ON public.poupeja_customers
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own customer data" ON public.poupeja_customers;
CREATE POLICY "Users can update their own customer data" ON public.poupeja_customers
FOR UPDATE USING (auth.uid() = user_id);