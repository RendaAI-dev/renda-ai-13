-- Migração para separar o campo address em campos estruturados
-- 1. Criar nova tabela temporária para backup dos dados existentes
CREATE TABLE IF NOT EXISTS address_backup AS 
SELECT id, address, created_at, updated_at 
FROM public.poupeja_users 
WHERE address IS NOT NULL AND address != '';

-- 2. Adicionar colunas específicas de endereço
ALTER TABLE public.poupeja_users 
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS logradouro TEXT,
ADD COLUMN IF NOT EXISTS numero TEXT,
ADD COLUMN IF NOT EXISTS complemento TEXT,
ADD COLUMN IF NOT EXISTS bairro TEXT,
ADD COLUMN IF NOT EXISTS cidade TEXT,
ADD COLUMN IF NOT EXISTS estado TEXT;

-- 3. Criar função para tentar extrair informações básicas dos endereços existentes
CREATE OR REPLACE FUNCTION public.migrate_address_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  address_parts TEXT[];
BEGIN
  -- Para usuários com endereço existente, tentar extrair algumas informações básicas
  FOR user_record IN 
    SELECT id, address 
    FROM public.poupeja_users 
    WHERE address IS NOT NULL AND address != '' AND cep IS NULL
  LOOP
    -- Dividir o endereço por vírgulas
    address_parts := string_to_array(user_record.address, ',');
    
    -- Se temos pelo menos 4 partes, tentar mapear
    IF array_length(address_parts, 1) >= 4 THEN
      UPDATE public.poupeja_users 
      SET 
        logradouro = TRIM(address_parts[1]),
        bairro = TRIM(address_parts[3]),
        cidade = TRIM(address_parts[4]),
        estado = CASE 
          WHEN array_length(address_parts, 1) >= 5 THEN TRIM(address_parts[5])
          ELSE NULL
        END
      WHERE id = user_record.id;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Migração de dados de endereço concluída';
END;
$$;

-- 4. Executar migração dos dados existentes
SELECT public.migrate_address_data();

-- 5. Atualizar função handle_auth_user_created para trabalhar com campos separados
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
  user_cep TEXT;
  user_logradouro TEXT;
  user_numero TEXT;
  user_complemento TEXT;
  user_bairro TEXT;
  user_cidade TEXT;
  user_estado TEXT;
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
  
  -- Extrair campos de endereço separados
  user_cep := COALESCE(NEW.raw_user_meta_data->>'cep', '');
  user_logradouro := COALESCE(NEW.raw_user_meta_data->>'logradouro', '');
  user_numero := COALESCE(NEW.raw_user_meta_data->>'numero', '');
  user_complemento := COALESCE(NEW.raw_user_meta_data->>'complemento', '');
  user_bairro := COALESCE(NEW.raw_user_meta_data->>'bairro', '');
  user_cidade := COALESCE(NEW.raw_user_meta_data->>'cidade', '');
  user_estado := COALESCE(NEW.raw_user_meta_data->>'estado', '');
  
  RAISE WARNING '[AUTH_TRIGGER] Dados processados - Nome: "%", CPF: "%", CEP: "%"', user_name, user_cpf, user_cep;
  
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
  
  RAISE WARNING '[AUTH_TRIGGER] ✅ SUCESSO - Usuário inserido em poupeja_users com campos de endereço separados: %', NEW.id;
  
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

-- 6. Remover a coluna address após confirmação da migração (será feito em próxima migração)
-- ALTER TABLE public.poupeja_users DROP COLUMN IF EXISTS address;

-- 7. Limpar função de migração temporária
DROP FUNCTION IF EXISTS public.migrate_address_data();