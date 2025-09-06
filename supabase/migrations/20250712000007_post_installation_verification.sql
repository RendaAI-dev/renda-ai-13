-- ========================================================================
-- VERIFICAÇÃO PÓS-INSTALAÇÃO
-- ========================================================================
-- Verifica se o sistema foi instalado corretamente
-- Cria funções auxiliares para recuperação e verificação
-- Data: 2025-07-12
-- Versão: 1.0

-- Função para verificar se a instalação foi bem-sucedida
CREATE OR REPLACE FUNCTION public.verify_installation()
RETURNS TABLE (
  component TEXT,
  status TEXT,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar se usuário admin existe
  RETURN QUERY SELECT 
    'Admin User'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@admin.com') 
         THEN 'OK' 
         ELSE 'MISSING' 
    END::TEXT,
    'admin@admin.com'::TEXT;

  -- Verificar se admin tem role correto
  RETURN QUERY SELECT 
    'Admin Role'::TEXT,
    CASE WHEN EXISTS (
      SELECT 1 FROM public.user_roles ur 
      JOIN auth.users u ON ur.user_id = u.id 
      WHERE u.email = 'admin@admin.com' AND ur.role = 'admin'
    ) THEN 'OK' ELSE 'MISSING' END::TEXT,
    'admin role assigned'::TEXT;

  -- Verificar se categorias padrão existem
  RETURN QUERY SELECT 
    'Default Categories'::TEXT,
    CASE WHEN (SELECT COUNT(*) FROM public.poupeja_categories WHERE user_id IS NULL) > 0 
         THEN 'OK' 
         ELSE 'MISSING' 
    END::TEXT,
    (SELECT COUNT(*)::TEXT FROM public.poupeja_categories WHERE user_id IS NULL) || ' categories'::TEXT;

  -- Verificar se storage bucket existe
  RETURN QUERY SELECT 
    'Storage Bucket'::TEXT,
    CASE WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE name = 'uploads') 
         THEN 'OK' 
         ELSE 'MISSING' 
    END::TEXT,
    'uploads bucket'::TEXT;

END;
$$;

-- FUNÇÃO REMOVIDA: recreate_admin_user()
-- Esta função foi removida pois tentava inserir manualmente nas tabelas auth.*
-- Use a edge function 'create-admin-user' que utiliza a API oficial do Supabase
-- POST /functions/v1/create-admin-user

-- Executar verificação da instalação
SELECT * FROM public.verify_installation();

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.verify_installation() TO authenticated, service_role;