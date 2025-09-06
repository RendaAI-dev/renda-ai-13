-- CORREÇÃO DEFINITIVA: Database error granting user
-- Esta migração resolve problemas de triggers e políticas RLS que impedem login

-- ==============================================================================
-- 1. DESABILITAR TRIGGERS PROBLEMÁTICOS TEMPORARIAMENTE
-- ==============================================================================

-- Desabilitar trigger que pode estar causando problema
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ==============================================================================
-- 2. CORRIGIR POLÍTICAS RLS PROBLEMÁTICAS
-- ==============================================================================

-- Remover políticas circulares na tabela user_roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert basic role" ON public.user_roles;

-- Criar políticas simples sem dependências circulares
CREATE POLICY "users_select_own_roles" ON public.user_roles
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "service_role_full_access" ON public.user_roles
  FOR ALL 
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ==============================================================================
-- 3. RECRIAR FUNÇÃO handle_new_user_signup SEM FALHAS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. CONFIRMAR EMAIL AUTOMATICAMENTE
  BEGIN
    UPDATE auth.users
    SET email_confirmed_at = NOW()
    WHERE id = NEW.id AND email_confirmed_at IS NULL;
  EXCEPTION 
    WHEN OTHERS THEN
      RAISE WARNING 'Error confirming email: %', SQLERRM;
  END;

  -- 2. INSERIR NA TABELA poupeja_users COM DADOS COMPLETOS
  BEGIN
    INSERT INTO public.poupeja_users (
      id, 
      email, 
      full_name,
      phone,
      created_at, 
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'phone', ''),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, poupeja_users.full_name),
      phone = COALESCE(EXCLUDED.phone, poupeja_users.phone),
      updated_at = NOW();
  EXCEPTION 
    WHEN OTHERS THEN
      -- Log error but don't fail the authentication
      RAISE WARNING 'Error inserting user into poupeja_users: %', SQLERRM;
  END;

  -- Inserir role básico de usuário com tratamento de erro
  BEGIN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'user'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  EXCEPTION 
    WHEN OTHERS THEN
      -- Log error but don't fail the authentication
      RAISE WARNING 'Error inserting user role: %', SQLERRM;
  END;

  -- Criar categorias padrão apenas para novos usuários
  IF TG_OP = 'INSERT' AND NEW.email_confirmed_at IS NOT NULL THEN
    BEGIN
      PERFORM public.create_default_categories_for_user(NEW.id);
    EXCEPTION 
      WHEN OTHERS THEN
        -- Log error but don't fail the authentication
        RAISE WARNING 'Error creating default categories: %', SQLERRM;
    END;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 4. RECRIAR TRIGGER COM CONDIÇÕES MAIS ESPECÍFICAS
-- ==============================================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (NEW.email IS NOT NULL)  -- Só executar se email existir
  EXECUTE FUNCTION public.handle_new_user_signup();

-- ==============================================================================
-- 5. FUNÇÃO PARA CONCEDER ACESSO ADMIN (SEM DEPENDÊNCIAS CIRCULARES)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.grant_admin_role(target_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Buscar usuário pelo email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário com email % não encontrado', target_email;
  END IF;
  
  -- Inserir role admin (SECURITY DEFINER bypassa RLS)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- ==============================================================================
-- 6. GARANTIR QUE O USUÁRIO ADMIN TENHA ACESSO
-- ==============================================================================

-- Tentar conceder acesso admin ao usuário admin@admin.com
DO $$
BEGIN
  PERFORM public.grant_admin_role('admin@admin.com');
EXCEPTION 
  WHEN OTHERS THEN
    RAISE WARNING 'Erro ao conceder acesso admin: %', SQLERRM;
END;
$$;

-- ==============================================================================
-- 7. FUNÇÃO AUXILIAR PARA VERIFICAR ROLES SEM DEPENDÊNCIA CIRCULAR
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.check_user_role(user_id UUID, target_role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = $1 AND ur.role = $2
  );
$$;