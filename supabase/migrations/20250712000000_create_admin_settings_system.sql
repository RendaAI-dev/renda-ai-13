-- ========================================================================
-- MIGRAÇÃO: Sistema de Configurações Administrativas
-- Data: 2025-07-12
-- Descrição: Migração de Edge Functions para tabelas de banco de dados
-- ========================================================================

-- 1. CRIAR TABELA PRINCIPAL: poupeja_settings
-- ========================================================================
CREATE TABLE IF NOT EXISTS public.poupeja_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('branding', 'stripe', 'pricing', 'contact', 'system')),
  key TEXT NOT NULL,
  value TEXT,
  value_type TEXT DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'json')),
  encrypted BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraint para garantir unicidade por categoria e chave
  UNIQUE(category, key)
);

-- 2. CRIAR TABELA DE HISTÓRICO: poupeja_settings_history  
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

-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- ========================================================================
CREATE INDEX IF NOT EXISTS idx_poupeja_settings_category ON public.poupeja_settings(category);
CREATE INDEX IF NOT EXISTS idx_poupeja_settings_key ON public.poupeja_settings(key);
CREATE INDEX IF NOT EXISTS idx_poupeja_settings_category_key ON public.poupeja_settings(category, key);
CREATE INDEX IF NOT EXISTS idx_poupeja_settings_history_setting_id ON public.poupeja_settings_history(setting_id);
CREATE INDEX IF NOT EXISTS idx_poupeja_settings_history_changed_at ON public.poupeja_settings_history(changed_at);

-- 4. HABILITAR ROW LEVEL SECURITY (RLS)
-- ========================================================================
ALTER TABLE public.poupeja_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poupeja_settings_history ENABLE ROW LEVEL SECURITY;

-- 5. CRIAR POLÍTICAS RLS - APENAS ADMINS
-- ========================================================================

-- Função auxiliar para verificar se usuário é admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = $1 AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas para poupeja_settings
CREATE POLICY "Only admins can view settings" ON public.poupeja_settings
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Only admins can insert settings" ON public.poupeja_settings
  FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update settings" ON public.poupeja_settings
  FOR UPDATE USING (public.is_admin());

CREATE POLICY "Only admins can delete settings" ON public.poupeja_settings
  FOR DELETE USING (public.is_admin());

-- Políticas para poupeja_settings_history (apenas leitura para admins)
CREATE POLICY "Only admins can view settings history" ON public.poupeja_settings_history
  FOR SELECT USING (public.is_admin());

-- 6. CRIAR TRIGGER PARA AUDITORIA AUTOMÁTICA
-- ========================================================================

-- Função trigger para auditoria
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
    
    -- Atualizar timestamp de updated_at
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

-- Criar triggers
CREATE TRIGGER audit_settings_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.poupeja_settings
  FOR EACH ROW EXECUTE FUNCTION public.audit_settings_changes();

-- 7. FUNÇÕES AUXILIARES PARA GERENCIAMENTO
-- ========================================================================

-- Função para buscar configuração específica
CREATE OR REPLACE FUNCTION public.get_setting(
  p_category TEXT,
  p_key TEXT
) RETURNS TEXT AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT value INTO setting_value
  FROM public.poupeja_settings
  WHERE category = p_category AND key = p_key;
  
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para buscar todas as configurações de uma categoria
CREATE OR REPLACE FUNCTION public.get_settings_by_category(
  p_category TEXT
) RETURNS TABLE(
  key TEXT,
  value TEXT,
  value_type TEXT,
  encrypted BOOLEAN,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.key, 
    s.value, 
    s.value_type, 
    s.encrypted, 
    s.description
  FROM public.poupeja_settings s
  WHERE s.category = p_category
  ORDER BY s.key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar/inserir configuração (upsert)
CREATE OR REPLACE FUNCTION public.upsert_setting(
  p_category TEXT,
  p_key TEXT,
  p_value TEXT,
  p_value_type TEXT DEFAULT 'string',
  p_encrypted BOOLEAN DEFAULT FALSE,
  p_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  setting_id UUID;
BEGIN
  INSERT INTO public.poupeja_settings (
    category, key, value, value_type, encrypted, description, created_by, updated_by
  ) VALUES (
    p_category, p_key, p_value, p_value_type, p_encrypted, p_description, auth.uid(), auth.uid()
  )
  ON CONFLICT (category, key) 
  DO UPDATE SET
    value = EXCLUDED.value,
    value_type = EXCLUDED.value_type,
    encrypted = EXCLUDED.encrypted,
    description = EXCLUDED.description,
    updated_by = auth.uid(),
    updated_at = NOW()
  RETURNING id INTO setting_id;
  
  RETURN setting_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criptografia básica (placeholder - implementar com chave real em produção)
CREATE OR REPLACE FUNCTION public.encrypt_setting_value(p_value TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Por enquanto, apenas base64 - implementar criptografia real depois
  RETURN encode(p_value::bytea, 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para descriptografia básica
CREATE OR REPLACE FUNCTION public.decrypt_setting_value(p_encrypted_value TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Por enquanto, apenas decode base64 - implementar descriptografia real depois  
  RETURN convert_from(decode(p_encrypted_value, 'base64'), 'UTF8');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. INSERIR DADOS INICIAIS ESSENCIAIS (9 REGISTROS OTIMIZADOS)
-- ========================================================================
-- Estrutura limpa e organizada - nomenclatura consistente e sem duplicações

-- BRANDING (4 campos essenciais)
INSERT INTO public.poupeja_settings (category, key, value, description) VALUES
  ('branding', 'company_name', 'PoupeJá', 'Nome da empresa exibido na aplicação'),
  ('branding', 'logo_url', '', 'URL da logo da empresa'),
  ('branding', 'favicon_url', '', 'URL do favicon'),
  ('branding', 'logo_alt_text', 'PoupeJá Logo', 'Texto alternativo da logo')
ON CONFLICT (category, key) DO NOTHING;

-- STRIPE (2 campos essenciais com prefixo stripe_)
INSERT INTO public.poupeja_settings (category, key, value, encrypted, description) VALUES
  ('stripe', 'stripe_secret_key', '', TRUE, 'Chave secreta do Stripe'),
  ('stripe', 'stripe_webhook_secret', '', TRUE, 'Secret do webhook do Stripe')
ON CONFLICT (category, key) DO NOTHING;

-- PRICING (2 campos essenciais)
INSERT INTO public.poupeja_settings (category, key, value, value_type, description) VALUES
  ('pricing', 'plan_price_monthly', '9.99', 'number', 'Preço mensal exibido no plano'),
  ('pricing', 'plan_price_annual', '99.99', 'number', 'Preço anual exibido no plano')
ON CONFLICT (category, key) DO NOTHING;

-- CONTACT (1 campo essencial)
INSERT INTO public.poupeja_settings (category, key, value, description) VALUES
  ('contact', 'support_email', 'support@poupeja.com', 'Email de suporte da empresa')
ON CONFLICT (category, key) DO NOTHING;

-- SYSTEM (configurações do sistema)
INSERT INTO public.poupeja_settings (category, key, value, description) VALUES
  ('system', 'supabase_url', '', 'URL base do projeto Supabase')
ON CONFLICT (category, key) DO NOTHING;

INSERT INTO public.poupeja_settings (category, key, value, value_type, description) VALUES
  ('system', 'max_file_size', '10485760', 'number', 'Tamanho máximo de arquivo em bytes (10MB)'),
  ('system', 'allowed_file_types', '["jpg","jpeg","png","gif","webp","pdf"]', 'json', 'Tipos de arquivo permitidos')
ON CONFLICT (category, key) DO NOTHING;

-- 9. COMENTÁRIOS E DOCUMENTAÇÃO
-- ========================================================================
COMMENT ON TABLE public.poupeja_settings IS 'Tabela principal para armazenar configurações administrativas do sistema';
COMMENT ON TABLE public.poupeja_settings_history IS 'Histórico de mudanças nas configurações administrativas';

COMMENT ON COLUMN public.poupeja_settings.category IS 'Categoria da configuração: branding, stripe, pricing, contact, system';
COMMENT ON COLUMN public.poupeja_settings.key IS 'Chave única da configuração dentro da categoria';
COMMENT ON COLUMN public.poupeja_settings.value IS 'Valor da configuração (pode estar criptografado)';
COMMENT ON COLUMN public.poupeja_settings.encrypted IS 'Indica se o valor está criptografado';
COMMENT ON COLUMN public.poupeja_settings.value_type IS 'Tipo do valor: string, number, boolean, json';

-- ========================================================================
-- FIM DA MIGRAÇÃO
-- ========================================================================