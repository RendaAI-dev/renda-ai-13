-- Atualizar função handle_auth_user_created para incluir novos campos
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  user_phone TEXT;
  user_cpf TEXT;
  user_birth_date DATE;
  user_address TEXT;
BEGIN
  -- Log detalhado
  RAISE WARNING '[AUTH_TRIGGER] Usuário criado no auth.users - ID: %, Email: %', NEW.id, NEW.email;
  RAISE WARNING '[AUTH_TRIGGER] Raw metadata: %', NEW.raw_user_meta_data;
  
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
  
  user_address := COALESCE(
    NEW.raw_user_meta_data->>'address',
    ''
  );
  
  RAISE WARNING '[AUTH_TRIGGER] Dados processados - Nome: "%", CPF: "%", Data Nascimento: "%"', user_name, user_cpf, user_birth_date;
  
  -- Confirmar email automaticamente
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id;
  
  -- Inserir na tabela poupeja_users com novos campos
  INSERT INTO public.poupeja_users (
    id, 
    email, 
    name, 
    phone,
    cpf,
    birth_date,
    address,
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
    NULLIF(user_address, ''),
    'free',
    NOW(),
    NOW()
  );
  
  RAISE WARNING '[AUTH_TRIGGER] ✅ SUCESSO - Usuário inserido em poupeja_users com novos campos: %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE WARNING '[AUTH_TRIGGER] ⚠️ Usuário já existe na poupeja_users: %', NEW.id;
    RETURN NEW;
  WHEN others THEN
    RAISE WARNING '[AUTH_TRIGGER] ❌ ERRO CRÍTICO: % - %', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$$;