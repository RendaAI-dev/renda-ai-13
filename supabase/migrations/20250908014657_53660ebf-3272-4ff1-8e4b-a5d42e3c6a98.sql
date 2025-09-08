-- Etapa 1: Corrigir o trigger e garantir que está ativo
-- Primeiro, vamos verificar se o trigger existe e recriar se necessário

DROP TRIGGER IF EXISTS auth_user_created_trigger ON auth.users;

-- Recriar o trigger
CREATE TRIGGER auth_user_created_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- Etapa 2: Criar função para corrigir dados faltantes de usuários existentes
CREATE OR REPLACE FUNCTION public.fix_missing_user_data()
RETURNS TABLE(fixed_count integer, details text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cnt INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Atualizar usuários que têm dados em auth.users mas não em poupeja_users
  FOR user_record IN
    SELECT 
      au.id, 
      au.email,
      au.raw_user_meta_data,
      pu.cpf, pu.birth_date, pu.cep, pu.logradouro, pu.cidade
    FROM auth.users au
    JOIN public.poupeja_users pu ON au.id = pu.id
    WHERE (
      pu.cpf IS NULL OR 
      pu.birth_date IS NULL OR 
      pu.cep IS NULL OR 
      pu.logradouro IS NULL OR 
      pu.cidade IS NULL
    )
    AND au.raw_user_meta_data IS NOT NULL
  LOOP
    -- Atualizar campos faltantes
    UPDATE public.poupeja_users 
    SET 
      cpf = CASE 
        WHEN cpf IS NULL AND TRIM(COALESCE(user_record.raw_user_meta_data->>'cpf', '')) != '' 
        THEN TRIM(user_record.raw_user_meta_data->>'cpf')
        ELSE cpf 
      END,
      birth_date = CASE 
        WHEN birth_date IS NULL AND user_record.raw_user_meta_data->>'birth_date' IS NOT NULL
        THEN (user_record.raw_user_meta_data->>'birth_date')::DATE
        ELSE birth_date 
      END,
      cep = CASE 
        WHEN cep IS NULL AND TRIM(COALESCE(user_record.raw_user_meta_data->>'cep', '')) != ''
        THEN TRIM(user_record.raw_user_meta_data->>'cep')
        ELSE cep 
      END,
      logradouro = CASE 
        WHEN logradouro IS NULL AND TRIM(COALESCE(user_record.raw_user_meta_data->>'logradouro', '')) != ''
        THEN TRIM(user_record.raw_user_meta_data->>'logradouro')
        ELSE logradouro 
      END,
      numero = CASE 
        WHEN numero IS NULL AND TRIM(COALESCE(user_record.raw_user_meta_data->>'numero', '')) != ''
        THEN TRIM(user_record.raw_user_meta_data->>'numero')
        ELSE numero 
      END,
      complemento = CASE 
        WHEN complemento IS NULL AND TRIM(COALESCE(user_record.raw_user_meta_data->>'complemento', '')) != ''
        THEN TRIM(user_record.raw_user_meta_data->>'complemento')
        ELSE complemento 
      END,
      bairro = CASE 
        WHEN bairro IS NULL AND TRIM(COALESCE(user_record.raw_user_meta_data->>'bairro', '')) != ''
        THEN TRIM(user_record.raw_user_meta_data->>'bairro')
        ELSE bairro 
      END,
      cidade = CASE 
        WHEN cidade IS NULL AND TRIM(COALESCE(user_record.raw_user_meta_data->>'cidade', '')) != ''
        THEN TRIM(user_record.raw_user_meta_data->>'cidade')
        ELSE cidade 
      END,
      estado = CASE 
        WHEN estado IS NULL AND TRIM(COALESCE(user_record.raw_user_meta_data->>'estado', '')) != ''
        THEN TRIM(user_record.raw_user_meta_data->>'estado')
        ELSE estado 
      END,
      phone = CASE 
        WHEN phone IS NULL AND TRIM(COALESCE(user_record.raw_user_meta_data->>'phone', '')) != ''
        THEN TRIM(user_record.raw_user_meta_data->>'phone')
        ELSE phone 
      END,
      updated_at = NOW()
    WHERE id = user_record.id;
    
    cnt := cnt + 1;
  END LOOP;
  
  fixed_count := cnt;
  details := format('Corrigidos %s usuários com dados faltantes', cnt);
  RETURN NEXT;
END;
$$;

-- Etapa 3: Executar a correção para todos os usuários com dados faltantes
SELECT * FROM public.fix_missing_user_data();

-- Etapa 4: Criar função para sincronizar usuários que faltam completamente
CREATE OR REPLACE FUNCTION public.sync_missing_auth_users()
RETURNS TABLE(synced_count integer, synced_users text[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cnt INTEGER := 0;
  user_emails TEXT[] := '{}';
BEGIN
  -- Insert missing users
  WITH inserted_users AS (
    INSERT INTO public.poupeja_users (
      id,
      email,
      name,
      current_plan_type,
      created_at,
      updated_at
    )
    SELECT 
      au.id,
      au.email,
      COALESCE(au.raw_user_meta_data->>'full_name', au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
      'free',
      au.created_at,
      NOW()
    FROM auth.users au
    LEFT JOIN public.poupeja_users pu ON au.id = pu.id
    WHERE pu.id IS NULL
    RETURNING email
  )
  SELECT COUNT(*)::INTEGER, array_agg(email)
  FROM inserted_users
  INTO cnt, user_emails;
  
  synced_count := cnt;
  synced_users := COALESCE(user_emails, '{}');
  
  RETURN NEXT;
END;
$$;

-- Executar sincronização de usuários faltantes
SELECT * FROM public.sync_missing_auth_users();