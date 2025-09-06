-- ========================================================================
-- MIGRAÇÃO: Funções Adicionais para Redistribuição
-- Data: 2025-07-12
-- Descrição: Funções auxiliares que podem estar em uso no sistema
-- ========================================================================

-- 1. FUNÇÃO PARA BUSCAR CADASTRO POR EMAIL
-- ========================================================================
CREATE OR REPLACE FUNCTION public.buscar_cadastro_por_email(p_email text)
RETURNS TABLE(user_id uuid, email text, subscription_status text, plan_type text, current_period_end timestamp with time zone) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id AS user_id,
        u.email,
        s.status AS subscription_status,
        s.plan_type,
        s.current_period_end
    FROM
        public.poupeja_users u
    LEFT JOIN
        public.poupeja_subscriptions s
        ON u.id = s.user_id AND s.status = 'active'
    WHERE
        u.email = p_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNÇÃO PARA ATUALIZAR VALOR DE METAS
-- ========================================================================
CREATE OR REPLACE FUNCTION public.update_goal_amount(p_goal_id UUID, p_amount_change NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_amount NUMERIC;
BEGIN
  -- Atualizar o valor atual da meta
  UPDATE public.poupeja_goals
  SET current_amount = current_amount + p_amount_change
  WHERE id = p_goal_id
  RETURNING current_amount INTO v_current_amount;
  
  -- Retornar o novo valor atual
  RETURN v_current_amount;
END;
$$;

-- 3. FUNÇÃO PARA CRIAR A FUNÇÃO UPDATE_GOAL_AMOUNT (USADA PELA EDGE FUNCTION)
-- ========================================================================
CREATE OR REPLACE FUNCTION public.create_update_goal_amount_function()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Criar a função update_goal_amount
  EXECUTE $FUNC$
  CREATE OR REPLACE FUNCTION public.update_goal_amount(p_goal_id UUID, p_amount_change NUMERIC)
  RETURNS NUMERIC
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $INNER$
  DECLARE
    v_current_amount NUMERIC;
  BEGIN
    -- Atualizar o valor atual da meta
    UPDATE public.poupeja_goals
    SET current_amount = current_amount + p_amount_change
    WHERE id = p_goal_id
    RETURNING current_amount INTO v_current_amount;
    
    -- Retornar o novo valor atual
    RETURN v_current_amount;
  END;
  $INNER$;
  $FUNC$;
  
  -- Conceder permissões
  GRANT EXECUTE ON FUNCTION public.update_goal_amount(UUID, NUMERIC) TO authenticated;
  GRANT EXECUTE ON FUNCTION public.update_goal_amount(UUID, NUMERIC) TO service_role;
  
  RAISE NOTICE 'Função update_goal_amount criada com sucesso';
END;
$$;

-- 4. FUNÇÕES PARA GERENCIAMENTO DE CONFIGURAÇÕES
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

-- NOTA: Função upsert_setting já criada em 20250712000000_create_admin_settings_system.sql

-- 5. FUNÇÕES DE CRIPTOGRAFIA BÁSICA
-- ========================================================================

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

-- 6. FUNÇÕES PARA GERENCIAMENTO DE ASSINATURAS
-- ========================================================================

-- Função para verificar status de assinatura
CREATE OR REPLACE FUNCTION public.get_user_subscription_status(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE(
  subscription_id UUID,
  status TEXT,
  plan_type TEXT,
  current_period_end TIMESTAMPTZ,
  is_active BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.status,
    s.plan_type,
    s.current_period_end,
    (s.status = 'active' AND s.current_period_end > NOW()) as is_active
  FROM public.poupeja_subscriptions s
  WHERE s.user_id = p_user_id
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar status de assinatura
CREATE OR REPLACE FUNCTION public.update_subscription_status(
  p_stripe_subscription_id TEXT,
  p_status TEXT,
  p_current_period_start TIMESTAMPTZ DEFAULT NULL,
  p_current_period_end TIMESTAMPTZ DEFAULT NULL,
  p_cancel_at_period_end BOOLEAN DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  subscription_id UUID;
BEGIN
  UPDATE public.poupeja_subscriptions
  SET 
    status = p_status,
    current_period_start = COALESCE(p_current_period_start, current_period_start),
    current_period_end = COALESCE(p_current_period_end, current_period_end),
    cancel_at_period_end = COALESCE(p_cancel_at_period_end, cancel_at_period_end),
    updated_at = NOW()
  WHERE stripe_subscription_id = p_stripe_subscription_id
  RETURNING id INTO subscription_id;
  
  RETURN subscription_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNÇÃO PARA MIGRAR USUÁRIOS EXISTENTES
-- ========================================================================
CREATE OR REPLACE FUNCTION public.migrate_existing_auth_users()
RETURNS VOID AS $$
DECLARE
  auth_user RECORD;
BEGIN
  -- Para cada usuário em auth.users que não está em poupeja_users
  FOR auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.poupeja_users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    -- Inserir usuário
    INSERT INTO public.poupeja_users (id, email, full_name)
    VALUES (
      auth_user.id,
      auth_user.email,
      COALESCE(auth_user.raw_user_meta_data->>'full_name', split_part(auth_user.email, '@', 1))
    );
    
    -- Criar categorias padrão
    PERFORM public.create_default_categories_for_user(auth_user.id);
  END LOOP;
  
  RAISE NOTICE 'Migração de usuários existentes concluída';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNÇÃO PARA FORÇAR CONFIRMAÇÃO DE EMAIL
-- ========================================================================
CREATE OR REPLACE FUNCTION public.confirm_user_email(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Buscar ID do usuário
  SELECT id INTO user_id FROM auth.users WHERE email = user_email;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', user_email;
  END IF;
  
  -- Confirmar email
  UPDATE auth.users 
  SET 
    email_confirmed_at = NOW()
  WHERE id = user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. FUNÇÃO PARA INSERIR USUÁRIO ADMIN INICIAL
-- ========================================================================
CREATE OR REPLACE FUNCTION public.create_initial_admin_user(
  admin_email TEXT DEFAULT 'admin@admin.com'
) RETURNS VOID AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Buscar usuário por email
  SELECT id INTO admin_user_id FROM auth.users WHERE email = admin_email;
  
  IF admin_user_id IS NOT NULL THEN
    -- Inserir role de admin se o usuário existir
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RAISE NOTICE 'Role de admin atribuído ao usuário: %', admin_email;
  ELSE
    RAISE NOTICE 'Usuário % não encontrado. Será criado automaticamente quando se registrar.', admin_email;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. CONCEDER PERMISSÕES
-- ========================================================================
GRANT EXECUTE ON FUNCTION public.buscar_cadastro_por_email(TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_goal_amount(UUID, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_update_goal_amount_function() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_setting(TEXT, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_settings_by_category(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.upsert_setting(TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_setting_value(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_setting_value(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_subscription_status(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.update_subscription_status(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN) TO service_role;
GRANT EXECUTE ON FUNCTION public.migrate_existing_auth_users() TO service_role;
GRANT EXECUTE ON FUNCTION public.confirm_user_email(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_initial_admin_user(TEXT) TO service_role;

-- 11. EXECUTAR MIGRAÇÃO INICIAL DE USUÁRIOS
-- ========================================================================
SELECT public.migrate_existing_auth_users();

-- 12. CRIAR USUÁRIO ADMIN INICIAL (SE NECESSÁRIO)
-- ========================================================================
SELECT public.create_initial_admin_user('admin@admin.com');

-- 13. COMENTÁRIOS
-- ========================================================================
COMMENT ON FUNCTION public.buscar_cadastro_por_email(TEXT) IS 'Busca dados de cadastro e assinatura por email';
COMMENT ON FUNCTION public.update_goal_amount(UUID, NUMERIC) IS 'Atualiza valor atual de uma meta financeira';
COMMENT ON FUNCTION public.get_setting(TEXT, TEXT) IS 'Busca uma configuração específica';
COMMENT ON FUNCTION public.get_settings_by_category(TEXT) IS 'Busca todas as configurações de uma categoria';
COMMENT ON FUNCTION public.upsert_setting(TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT) IS 'Insere ou atualiza uma configuração';
COMMENT ON FUNCTION public.get_user_subscription_status(UUID) IS 'Retorna status atual da assinatura do usuário';
COMMENT ON FUNCTION public.update_subscription_status(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, BOOLEAN) IS 'Atualiza status de assinatura via webhook';
COMMENT ON FUNCTION public.create_initial_admin_user(TEXT) IS 'Cria usuário admin inicial do sistema';

-- ========================================================================
-- FIM DAS FUNÇÕES ADICIONAIS
-- ========================================================================