-- 🔧 CORREÇÃO COMPLETA: Trigger de registro com todos os campos
-- Dropping existing trigger and function to recreate with proper field handling

DROP TRIGGER IF EXISTS auth_user_created_trigger ON auth.users;
DROP FUNCTION IF EXISTS public.handle_auth_user_created();

-- Criar função melhorada com logs detalhados e extração completa de campos
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
  metadata_json TEXT;
BEGIN
  -- Log inicial com mais detalhes
  RAISE NOTICE '[AUTH_TRIGGER] 🚀 Iniciando processamento para usuário: % (ID: %)', NEW.email, NEW.id;
  
  -- Converter metadata para texto para log
  metadata_json := NEW.raw_user_meta_data::text;
  RAISE NOTICE '[AUTH_TRIGGER] 📋 Raw metadata recebido: %', COALESCE(metadata_json, 'NULL');
  
  -- Confirmar email automaticamente PRIMEIRO
  UPDATE auth.users
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id;
  
  RAISE NOTICE '[AUTH_TRIGGER] ✅ Email confirmado automaticamente';
  
  -- Extrair dados básicos
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
  
  -- Extrair CPF com log detalhado
  user_cpf := COALESCE(NEW.raw_user_meta_data->>'cpf', '');
  RAISE NOTICE '[AUTH_TRIGGER] 🆔 CPF extraído: "%"', COALESCE(user_cpf, 'VAZIO');
  
  -- Extrair data de nascimento com tratamento de erro
  BEGIN
    user_birth_date := (NEW.raw_user_meta_data->>'birth_date')::DATE;
    RAISE NOTICE '[AUTH_TRIGGER] 📅 Data nascimento extraída: %', COALESCE(user_birth_date::text, 'NULL');
  EXCEPTION
    WHEN others THEN
      user_birth_date := NULL;
      RAISE NOTICE '[AUTH_TRIGGER] ⚠️ Erro ao converter data nascimento: %', SQLERRM;
  END;
  
  -- Extrair endereço completo
  user_cep := COALESCE(NEW.raw_user_meta_data->>'cep', '');
  user_logradouro := COALESCE(NEW.raw_user_meta_data->>'logradouro', '');
  user_numero := COALESCE(NEW.raw_user_meta_data->>'numero', '');
  user_complemento := COALESCE(NEW.raw_user_meta_data->>'complemento', '');
  user_bairro := COALESCE(NEW.raw_user_meta_data->>'bairro', '');
  user_cidade := COALESCE(NEW.raw_user_meta_data->>'cidade', '');
  user_estado := COALESCE(NEW.raw_user_meta_data->>'estado', '');
  
  RAISE NOTICE '[AUTH_TRIGGER] 🏠 Endereço extraído - CEP: "%" | Logradouro: "%" | Cidade: "%"', 
    COALESCE(user_cep, 'VAZIO'), 
    COALESCE(user_logradouro, 'VAZIO'), 
    COALESCE(user_cidade, 'VAZIO');
  
  -- Inserir na tabela poupeja_users com TODOS os campos
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
    NULLIF(TRIM(user_name), ''),
    NULLIF(TRIM(user_phone), ''),
    NULLIF(TRIM(user_cpf), ''),
    user_birth_date,
    NULLIF(TRIM(user_cep), ''),
    NULLIF(TRIM(user_logradouro), ''),
    NULLIF(TRIM(user_numero), ''),
    NULLIF(TRIM(user_complemento), ''),
    NULLIF(TRIM(user_bairro), ''),
    NULLIF(TRIM(user_cidade), ''),
    NULLIF(TRIM(user_estado), ''),
    'free',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '[AUTH_TRIGGER] ✅ SUCESSO TOTAL - Usuário inserido com todos os campos: %', NEW.id;
  
  RETURN NEW;
  
EXCEPTION
  WHEN unique_violation THEN
    RAISE NOTICE '[AUTH_TRIGGER] ⚠️ Usuário já existe (ignorando): %', NEW.id;
    RETURN NEW;
  WHEN others THEN
    RAISE NOTICE '[AUTH_TRIGGER] ❌ ERRO CRÍTICO: % | Estado: % | Detalhe: %', SQLERRM, SQLSTATE, SQLERRM;
    -- Tentar inserir ao menos os dados básicos
    BEGIN
      INSERT INTO public.poupeja_users (id, email, name, current_plan_type, created_at, updated_at)
      VALUES (NEW.id, NEW.email, COALESCE(user_name, ''), 'free', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
      RAISE NOTICE '[AUTH_TRIGGER] 🔄 Inserção básica de fallback realizada';
    EXCEPTION
      WHEN others THEN
        RAISE NOTICE '[AUTH_TRIGGER] 💥 FALHA TOTAL NO FALLBACK: %', SQLERRM;
    END;
    RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER auth_user_created_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- Função para corrigir usuários existentes com dados faltantes
CREATE OR REPLACE FUNCTION public.fix_missing_user_data()
RETURNS TABLE(fixed_count integer, details text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cnt INTEGER := 0;
  user_record RECORD;
  fixed_fields TEXT[];
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
    fixed_fields := '{}';
    
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

-- Executar a correção imediatamente
SELECT * FROM public.fix_missing_user_data();

RAISE NOTICE '🎉 CORREÇÃO COMPLETA APLICADA - Trigger recriado e usuários existentes corrigidos!';