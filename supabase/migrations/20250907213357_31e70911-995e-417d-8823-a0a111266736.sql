-- Drop and recreate the trigger to ensure proper attachment
DROP TRIGGER IF EXISTS auth_user_created_trigger ON auth.users;

-- Drop and recreate the function with better error handling
DROP FUNCTION IF EXISTS public.handle_auth_user_created();

CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_name TEXT;
  user_phone TEXT;
  user_cpf TEXT;
  user_birth_date DATE;
  user_cep TEXT;
  user_logradouro TEXT;
  user_numero TEXT;
  user_complemento TEXT;
  user_bairro TEXT;
  user_cidade TEXT;
  user_estado TEXT;
BEGIN
  -- Log detalhado com RAISE NOTICE para garantir que apareça nos logs
  RAISE NOTICE '[AUTH_TRIGGER] Usuário criado no auth.users - ID: %, Email: %', NEW.id, NEW.email;
  RAISE NOTICE '[AUTH_TRIGGER] Raw metadata: %', NEW.raw_user_meta_data;
  
  -- Extrair dados do metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'fullName',
    ''
  );
  
  user_phone := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'whatsapp',
    ''
  );
  
  user_cpf := COALESCE(
    NEW.raw_user_meta_data->>'cpf',
    ''
  );
  
  -- Converter data de nascimento
  BEGIN
    user_birth_date := (NEW.raw_user_meta_data->>'birth_date')::DATE;
  EXCEPTION
    WHEN others THEN
      user_birth_date := NULL;
  END;
  
  -- Extrair campos de endereço separados
  user_cep := COALESCE(NEW.raw_user_meta_data->>'cep', '');
  user_logradouro := COALESCE(NEW.raw_user_meta_data->>'logradouro', '');
  user_numero := COALESCE(NEW.raw_user_meta_data->>'numero', '');
  user_complemento := COALESCE(NEW.raw_user_meta_data->>'complemento', '');
  user_bairro := COALESCE(NEW.raw_user_meta_data->>'bairro', '');
  user_cidade := COALESCE(NEW.raw_user_meta_data->>'cidade', '');
  user_estado := COALESCE(NEW.raw_user_meta_data->>'estado', '');
  
  RAISE NOTICE '[AUTH_TRIGGER] Dados processados - Nome: "%", CPF: "%", CEP: "%"', user_name, user_cpf, user_cep;
  
  -- Confirmar email automaticamente
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id;
  
  -- Inserir na tabela poupeja_users
  INSERT INTO public.poupeja_users (
    id, 
    email, 
    name, 
    phone,
    cpf,
    birth_date,
    cep,
    logradouro,
    numero,
    complemento,
    bairro,
    cidade,
    estado,
    current_plan_type,
    created_at, 
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    NULLIF(user_name, ''),
    NULLIF(user_phone, ''),
    NULLIF(user_cpf, ''),
    user_birth_date,
    NULLIF(user_cep, ''),
    NULLIF(user_logradouro, ''),
    NULLIF(user_numero, ''),
    NULLIF(user_complemento, ''),
    NULLIF(user_bairro, ''),
    NULLIF(user_cidade, ''),
    NULLIF(user_estado, ''),
    'free',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '[AUTH_TRIGGER] ✅ SUCESSO - Usuário inserido em poupeja_users: %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE '[AUTH_TRIGGER] ⚠️ Usuário já existe na poupeja_users: %', NEW.id;
    RETURN NEW;
  WHEN others THEN
    RAISE NOTICE '[AUTH_TRIGGER] ❌ ERRO CRÍTICO: % - %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER auth_user_created_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- Migrate existing users that are missing from poupeja_users
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
WHERE pu.id IS NULL;

-- Create a function to manually sync missing users (fallback)
CREATE OR REPLACE FUNCTION public.sync_missing_auth_users()
RETURNS TABLE(synced_count integer, synced_users text[])
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$;