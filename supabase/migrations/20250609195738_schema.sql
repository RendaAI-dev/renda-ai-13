-- 1. CRIAÇÃO DE TABELAS

-- 1.1 Tabela de usuários
CREATE TABLE public.poupeja_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  phone text,
  profile_image text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 1.2 Tabela de categorias
CREATE TABLE public.poupeja_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  color text NOT NULL DEFAULT '#9E9E9E',
  icon text DEFAULT 'circle',
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 1.3 Tabela de metas/objetivos
CREATE TABLE public.poupeja_goals (
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

-- 1.4 Tabela de transações
CREATE TABLE public.poupeja_transactions (
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

-- 1.5 Tabela de transações agendadas
CREATE TABLE public.poupeja_scheduled_transactions (
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

-- 1.6 Tabela de assinaturas
CREATE TABLE public.poupeja_subscriptions (
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

-- 2. HABILITAR RLS EM TODAS AS TABELAS
ALTER TABLE public.poupeja_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_scheduled_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_subscriptions ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS RLS

-- 3.1 Políticas para poupeja_users
CREATE POLICY "Users can view their own profile" ON public.poupeja_users
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow trigger to insert users" ON public.poupeja_users
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own profile" ON public.poupeja_users
FOR UPDATE USING (auth.uid() = id);

-- 3.2 Políticas para poupeja_categories
CREATE POLICY "Users can view their own categories" ON public.poupeja_categories
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own categories" ON public.poupeja_categories
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories" ON public.poupeja_categories
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories" ON public.poupeja_categories
FOR DELETE USING (auth.uid() = user_id);

-- 3.3 Políticas para poupeja_transactions
CREATE POLICY "Users can view their own transactions" ON public.poupeja_transactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON public.poupeja_transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON public.poupeja_transactions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON public.poupeja_transactions
FOR DELETE USING (auth.uid() = user_id);

-- 3.4 Políticas para poupeja_goals
CREATE POLICY "Users can view their own goals" ON public.poupeja_goals
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" ON public.poupeja_goals
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" ON public.poupeja_goals
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" ON public.poupeja_goals
FOR DELETE USING (auth.uid() = user_id);

-- 3.5 Políticas para poupeja_scheduled_transactions
CREATE POLICY "Users can view their own scheduled transactions" ON public.poupeja_scheduled_transactions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scheduled transactions" ON public.poupeja_scheduled_transactions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scheduled transactions" ON public.poupeja_scheduled_transactions
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scheduled transactions" ON public.poupeja_scheduled_transactions
FOR DELETE USING (auth.uid() = user_id);

-- 3.6 Políticas para poupeja_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.poupeja_subscriptions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" ON public.poupeja_subscriptions
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" ON public.poupeja_subscriptions
FOR UPDATE USING (auth.uid() = user_id);

-- 4. FUNÇÕES E TRIGGERS

-- 4.1 Função para criar usuários automaticamente
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log da tentativa de criação
  RAISE LOG 'Trigger handle_new_user executado para usuário ID: %', NEW.id;
  
  -- Inserir o usuário na tabela poupeja_users
  INSERT INTO public.poupeja_users (id, email, name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  RAISE LOG 'Usuário criado com sucesso na tabela poupeja_users: %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    -- Se o usuário já existe, apenas log e continua
    RAISE LOG 'Usuário já existe na tabela poupeja_users: %', NEW.id;
    RETURN NEW;
  WHEN others THEN
    -- Log erro mas não falhe o signup
    RAISE WARNING 'Erro ao criar usuário em poupeja_users: % - %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;

-- 4.2 Trigger para criar usuários automaticamente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4.3 Função para recuperar usuários perdidos
CREATE OR REPLACE FUNCTION public.recover_missing_users()
RETURNS TABLE(recovered_count INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cnt INTEGER := 0;
BEGIN
  -- Insere usuários que existem em auth.users mas não em poupeja_users
  INSERT INTO public.poupeja_users (id, email, name, phone)
  SELECT 
    au.id, 
    au.email, 
    au.raw_user_meta_data->>'name', 
    au.raw_user_meta_data->>'phone'
  FROM auth.users au
  LEFT JOIN public.poupeja_users pu ON au.id = pu.id
  WHERE pu.id IS NULL;
  
  GET DIAGNOSTICS cnt = ROW_COUNT;
  recovered_count := cnt;
  RETURN NEXT;
END;
$$;

-- 5. INSERÇÃO DE CATEGORIAS PADRÃO

-- Limpar categorias padrão existentes para evitar duplicações em migrações repetidas
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