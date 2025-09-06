-- ========================================================================
-- MIGRAÇÃO COMPLETA PARA REDISTRIBUIÇÃO: PoupeJá Sistema Completo
-- Data: 2025-07-12
-- Descrição: Schema completo consolidado para novas instalações
-- ========================================================================

-- 1. EXTENSÕES NECESSÁRIAS
-- ========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM PARA ROLES DE USUÁRIO
-- ========================================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 3. TABELA DE USUÁRIOS (poupeja_users)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.poupeja_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  date_of_birth DATE,
  preferred_language TEXT DEFAULT 'pt' CHECK (preferred_language IN ('pt', 'en')),
  preferred_currency TEXT DEFAULT 'BRL' CHECK (preferred_currency IN ('BRL', 'USD', 'EUR')),
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABELA DE ROLES DE USUÁRIOS
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

-- 5. TABELA DE CLIENTES (poupeja_customers)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.poupeja_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABELA DE ASSINATURAS (poupeja_subscriptions)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.poupeja_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.poupeja_users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'canceled', 'past_due', 'unpaid')),
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABELA DE CATEGORIAS (poupeja_categories)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.poupeja_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.poupeja_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  icon TEXT NOT NULL DEFAULT 'folder',
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'both')),
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, name)
);

-- 8. TABELA DE TRANSAÇÕES (poupeja_transactions)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.poupeja_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.poupeja_users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.poupeja_categories(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABELA DE METAS (poupeja_goals)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.poupeja_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.poupeja_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  target_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  target_date DATE,
  category TEXT,
  color TEXT DEFAULT '#10B981',
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABELA DE TRANSAÇÕES AGENDADAS (poupeja_scheduled_transactions)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.poupeja_scheduled_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.poupeja_users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.poupeja_categories(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  description TEXT NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  next_execution_date DATE,
  last_execution_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABELA DE CONFIGURAÇÕES ADMINISTRATIVAS (poupeja_settings)
-- ========================================================================
-- NOTA: Tabela criada em 20250712000000_create_admin_settings_system.sql

-- 12. TABELA DE HISTÓRICO DE CONFIGURAÇÕES (poupeja_settings_history)
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.poupeja_settings_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_id UUID REFERENCES public.poupeja_settings(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE'))
);

-- 13. HABILITAR ROW LEVEL SECURITY (RLS)
-- ========================================================================
ALTER TABLE public.poupeja_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_scheduled_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_settings_history ENABLE ROW LEVEL SECURITY;

-- 14. CRIAR FUNÇÕES AUXILIARES
-- ========================================================================

-- Função para verificar se usuário tem role específico
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Função para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = $1 AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar categorias padrão
CREATE OR REPLACE FUNCTION public.create_default_categories_for_user(user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Categorias de Receita
  INSERT INTO public.poupeja_categories (user_id, name, color, icon, type, is_default) VALUES
    (user_id, 'Salário', '#10B981', 'briefcase', 'income', true),
    (user_id, 'Freelance', '#8B5CF6', 'code', 'income', true),
    (user_id, 'Investimentos', '#F59E0B', 'trending-up', 'income', true),
    (user_id, 'Outros', '#6B7280', 'plus-circle', 'income', true)
  ON CONFLICT (user_id, name) DO NOTHING;

  -- Categorias de Despesa
  INSERT INTO public.poupeja_categories (user_id, name, color, icon, type, is_default) VALUES
    (user_id, 'Alimentação', '#EF4444', 'utensils', 'expense', true),
    (user_id, 'Transporte', '#3B82F6', 'car', 'expense', true),
    (user_id, 'Moradia', '#8B5CF6', 'home', 'expense', true),
    (user_id, 'Saúde', '#10B981', 'heart', 'expense', true),
    (user_id, 'Educação', '#F59E0B', 'book-open', 'expense', true),
    (user_id, 'Lazer', '#EC4899', 'smile', 'expense', true),
    (user_id, 'Compras', '#F97316', 'shopping-bag', 'expense', true),
    (user_id, 'Contas', '#6B7280', 'file-text', 'expense', true),
    (user_id, 'Outros', '#6B7280', 'more-horizontal', 'expense', true)
  ON CONFLICT (user_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para lidar com novos usuários
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir ou atualizar dados do usuário na tabela poupeja_users
  INSERT INTO public.poupeja_users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, poupeja_users.full_name),
    updated_at = NOW();

  -- Criar categorias padrão para o usuário (apenas se for um insert)
  IF TG_OP = 'INSERT' THEN
    PERFORM public.create_default_categories_for_user(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para auditoria de settings
CREATE OR REPLACE FUNCTION public.audit_settings_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Para INSERT
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.poupeja_settings_history (
      setting_id, category, key, old_value, new_value, changed_by, action
    ) VALUES (
      NEW.id, NEW.category, NEW.key, NULL, NEW.value, auth.uid(), 'CREATE'
    );
    RETURN NEW;
  END IF;

  -- Para UPDATE
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.poupeja_settings_history (
      setting_id, category, key, old_value, new_value, changed_by, action
    ) VALUES (
      NEW.id, NEW.category, NEW.key, OLD.value, NEW.value, auth.uid(), 'UPDATE'
    );
    
    NEW.updated_at = NOW();
    RETURN NEW;
  END IF;

  -- Para DELETE
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.poupeja_settings_history (
      setting_id, category, key, old_value, new_value, changed_by, action
    ) VALUES (
      OLD.id, OLD.category, OLD.key, OLD.value, NULL, auth.uid(), 'DELETE'
    );
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. CRIAR POLÍTICAS RLS
-- ========================================================================

-- Políticas para poupeja_users
DROP POLICY IF EXISTS "Users can view own profile" ON public.poupeja_users;
CREATE POLICY "Users can view own profile" ON public.poupeja_users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.poupeja_users;
CREATE POLICY "Users can update own profile" ON public.poupeja_users
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.poupeja_users;
CREATE POLICY "Users can insert own profile" ON public.poupeja_users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Políticas para user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Políticas para poupeja_customers
DROP POLICY IF EXISTS "Users can view own customer data" ON public.poupeja_customers;
CREATE POLICY "Users can view own customer data" ON public.poupeja_customers
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can manage customers" ON public.poupeja_customers;
CREATE POLICY "Service role can manage customers" ON public.poupeja_customers
  FOR ALL USING (true);

-- Políticas para poupeja_subscriptions
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.poupeja_subscriptions;
CREATE POLICY "Users can view own subscriptions" ON public.poupeja_subscriptions
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role full access" ON public.poupeja_subscriptions;
CREATE POLICY "Service role full access" ON public.poupeja_subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

DROP POLICY IF EXISTS "Allow webhook insertions" ON public.poupeja_subscriptions;
CREATE POLICY "Allow webhook insertions" ON public.poupeja_subscriptions
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow webhook updates" ON public.poupeja_subscriptions;
CREATE POLICY "Allow webhook updates" ON public.poupeja_subscriptions
  FOR UPDATE USING (true);

-- Políticas para poupeja_categories
DROP POLICY IF EXISTS "Users can manage own categories" ON public.poupeja_categories;
CREATE POLICY "Users can manage own categories" ON public.poupeja_categories
  FOR ALL USING (user_id = auth.uid());

-- Políticas para poupeja_transactions
DROP POLICY IF EXISTS "Users can manage own transactions" ON public.poupeja_transactions;
CREATE POLICY "Users can manage own transactions" ON public.poupeja_transactions
  FOR ALL USING (user_id = auth.uid());

-- Políticas para poupeja_goals
DROP POLICY IF EXISTS "Users can manage own goals" ON public.poupeja_goals;
CREATE POLICY "Users can manage own goals" ON public.poupeja_goals
  FOR ALL USING (user_id = auth.uid());

-- Políticas para poupeja_scheduled_transactions
DROP POLICY IF EXISTS "Users can manage own scheduled transactions" ON public.poupeja_scheduled_transactions;
CREATE POLICY "Users can manage own scheduled transactions" ON public.poupeja_scheduled_transactions
  FOR ALL USING (user_id = auth.uid());

-- Políticas para poupeja_settings (apenas admins)
DROP POLICY IF EXISTS "Only admins can view settings" ON public.poupeja_settings;
CREATE POLICY "Only admins can view settings" ON public.poupeja_settings
  FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can insert settings" ON public.poupeja_settings;
CREATE POLICY "Only admins can insert settings" ON public.poupeja_settings
  FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can update settings" ON public.poupeja_settings;
CREATE POLICY "Only admins can update settings" ON public.poupeja_settings
  FOR UPDATE USING (public.is_admin());

DROP POLICY IF EXISTS "Only admins can delete settings" ON public.poupeja_settings;
CREATE POLICY "Only admins can delete settings" ON public.poupeja_settings
  FOR DELETE USING (public.is_admin());

-- Políticas para poupeja_settings_history (apenas leitura para admins)
DROP POLICY IF EXISTS "Only admins can view settings history" ON public.poupeja_settings_history;
CREATE POLICY "Only admins can view settings history" ON public.poupeja_settings_history
  FOR SELECT USING (public.is_admin());

-- 16. CRIAR TRIGGERS
-- ========================================================================

-- Trigger para criação de usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- Triggers para updated_at
DROP TRIGGER IF EXISTS update_poupeja_users_updated_at ON public.poupeja_users;
CREATE TRIGGER update_poupeja_users_updated_at BEFORE UPDATE ON public.poupeja_users FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_poupeja_subscriptions_updated_at ON public.poupeja_subscriptions;
CREATE TRIGGER update_poupeja_subscriptions_updated_at BEFORE UPDATE ON public.poupeja_subscriptions FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_poupeja_categories_updated_at ON public.poupeja_categories;
CREATE TRIGGER update_poupeja_categories_updated_at BEFORE UPDATE ON public.poupeja_categories FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_poupeja_transactions_updated_at ON public.poupeja_transactions;
CREATE TRIGGER update_poupeja_transactions_updated_at BEFORE UPDATE ON public.poupeja_transactions FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_poupeja_goals_updated_at ON public.poupeja_goals;
CREATE TRIGGER update_poupeja_goals_updated_at BEFORE UPDATE ON public.poupeja_goals FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_poupeja_scheduled_transactions_updated_at ON public.poupeja_scheduled_transactions;
CREATE TRIGGER update_poupeja_scheduled_transactions_updated_at BEFORE UPDATE ON public.poupeja_scheduled_transactions FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Trigger para auditoria de settings
DROP TRIGGER IF EXISTS audit_settings_changes_trigger ON public.poupeja_settings;
CREATE TRIGGER audit_settings_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.poupeja_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_settings_changes();

-- 17. CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================================================
CREATE INDEX IF NOT EXISTS idx_poupeja_users_email ON public.poupeja_users(email);
CREATE INDEX IF NOT EXISTS idx_poupeja_customers_user_id ON public.poupeja_customers(user_id);
CREATE INDEX IF NOT EXISTS idx_poupeja_customers_stripe_customer_id ON public.poupeja_customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_poupeja_subscriptions_user_id ON public.poupeja_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_poupeja_subscriptions_stripe_subscription_id ON public.poupeja_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_poupeja_categories_user_id ON public.poupeja_categories(user_id);
CREATE INDEX IF NOT EXISTS idx_poupeja_transactions_user_id ON public.poupeja_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_poupeja_transactions_date ON public.poupeja_transactions(date);
CREATE INDEX IF NOT EXISTS idx_poupeja_transactions_category_id ON public.poupeja_transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_poupeja_goals_user_id ON public.poupeja_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_poupeja_scheduled_transactions_user_id ON public.poupeja_scheduled_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_poupeja_scheduled_transactions_next_execution ON public.poupeja_scheduled_transactions(next_execution_date);
CREATE INDEX IF NOT EXISTS idx_poupeja_settings_category ON public.poupeja_settings(category);
CREATE INDEX IF NOT EXISTS idx_poupeja_settings_key ON public.poupeja_settings(key);
CREATE INDEX IF NOT EXISTS idx_poupeja_settings_category_key ON public.poupeja_settings(category, key);
CREATE INDEX IF NOT EXISTS idx_poupeja_settings_history_setting_id ON public.poupeja_settings_history(setting_id);
CREATE INDEX IF NOT EXISTS idx_poupeja_settings_history_changed_at ON public.poupeja_settings_history(changed_at);

-- 18. ADICIONAR RESTRIÇÕES ÚNICAS
-- ========================================================================
ALTER TABLE public.poupeja_subscriptions 
DROP CONSTRAINT IF EXISTS poupeja_subscriptions_stripe_subscription_id_unique;
ALTER TABLE public.poupeja_subscriptions 
ADD CONSTRAINT poupeja_subscriptions_stripe_subscription_id_unique 
UNIQUE (stripe_subscription_id);

ALTER TABLE public.poupeja_subscriptions 
DROP CONSTRAINT IF EXISTS poupeja_subscriptions_user_id_unique;
ALTER TABLE public.poupeja_subscriptions 
ADD CONSTRAINT poupeja_subscriptions_user_id_unique 
UNIQUE (user_id);

-- 19. INSERIR DADOS INICIAIS
-- ========================================================================

-- NOTA: Dados iniciais inseridos em 20250712000000_create_admin_settings_system.sql

-- 20. CONCEDER PERMISSÕES
-- ========================================================================
GRANT EXECUTE ON FUNCTION public.has_role(UUID, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_default_categories_for_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user_signup() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.audit_settings_changes() TO authenticated;

-- 21. COMENTÁRIOS PARA DOCUMENTAÇÃO
-- ========================================================================
COMMENT ON TABLE public.poupeja_users IS 'Tabela de usuários do sistema PoupeJá';
COMMENT ON TABLE public.user_roles IS 'Roles dos usuários (admin/user)';
COMMENT ON TABLE public.poupeja_customers IS 'Dados dos clientes no Stripe';
COMMENT ON TABLE public.poupeja_subscriptions IS 'Assinaturas dos usuários integradas com Stripe';
COMMENT ON TABLE public.poupeja_categories IS 'Categorias de transações personalizáveis por usuário';
COMMENT ON TABLE public.poupeja_transactions IS 'Transações financeiras dos usuários';
COMMENT ON TABLE public.poupeja_goals IS 'Metas financeiras dos usuários';
COMMENT ON TABLE public.poupeja_scheduled_transactions IS 'Transações recorrentes agendadas';
COMMENT ON TABLE public.poupeja_settings IS 'Configurações administrativas do sistema';
COMMENT ON TABLE public.poupeja_settings_history IS 'Histórico de mudanças nas configurações administrativas';

-- ========================================================================
-- FIM DA MIGRAÇÃO COMPLETA PARA REDISTRIBUIÇÃO
-- ========================================================================