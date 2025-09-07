-- Adicionar novas colunas na tabela poupeja_users
ALTER TABLE public.poupeja_users 
ADD COLUMN cpf TEXT,
ADD COLUMN birth_date DATE,
ADD COLUMN address TEXT,
ADD COLUMN current_plan_type TEXT DEFAULT 'free';

-- Criar índice único para CPF (quando não for nulo)
CREATE UNIQUE INDEX idx_poupeja_users_cpf ON public.poupeja_users (cpf) WHERE cpf IS NOT NULL;

-- Função para sincronizar plano atual do usuário
CREATE OR REPLACE FUNCTION public.sync_user_current_plan()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar o plano atual na tabela poupeja_users
  UPDATE public.poupeja_users 
  SET current_plan_type = CASE 
    WHEN NEW.status = 'active' THEN NEW.plan_type
    ELSE 'free'
  END
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar plano quando subscription for criada/atualizada
CREATE TRIGGER sync_user_plan_on_subscription_change
AFTER INSERT OR UPDATE ON public.poupeja_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.sync_user_current_plan();

-- Função para sincronizar planos existentes
CREATE OR REPLACE FUNCTION public.sync_existing_user_plans()
RETURNS void AS $$
BEGIN
  -- Atualizar usuários com subscriptions ativas
  UPDATE public.poupeja_users 
  SET current_plan_type = s.plan_type
  FROM public.poupeja_subscriptions s
  WHERE poupeja_users.id = s.user_id 
    AND s.status = 'active'
    AND s.current_period_end > NOW();
    
  -- Garantir que usuários sem subscription ativa tenham plano 'free'
  UPDATE public.poupeja_users 
  SET current_plan_type = 'free'
  WHERE id NOT IN (
    SELECT user_id FROM public.poupeja_subscriptions 
    WHERE status = 'active' AND current_period_end > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Executar sincronização inicial
SELECT public.sync_existing_user_plans();

-- Função utilitária para validar CPF
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf_input TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  cpf TEXT;
  digit1 INTEGER;
  digit2 INTEGER;
  sum1 INTEGER := 0;
  sum2 INTEGER := 0;
  i INTEGER;
BEGIN
  -- Remover caracteres não numéricos
  cpf := regexp_replace(cpf_input, '[^0-9]', '', 'g');
  
  -- Verificar se tem 11 dígitos
  IF length(cpf) != 11 THEN
    RETURN FALSE;
  END IF;
  
  -- Verificar se todos os dígitos são iguais
  IF cpf ~ '^(.)\1{10}$' THEN
    RETURN FALSE;
  END IF;
  
  -- Calcular primeiro dígito verificador
  FOR i IN 1..9 LOOP
    sum1 := sum1 + (substring(cpf, i, 1)::INTEGER * (11 - i));
  END LOOP;
  
  digit1 := 11 - (sum1 % 11);
  IF digit1 >= 10 THEN
    digit1 := 0;
  END IF;
  
  -- Calcular segundo dígito verificador
  FOR i IN 1..10 LOOP
    sum2 := sum2 + (substring(cpf, i, 1)::INTEGER * (12 - i));
  END LOOP;
  
  digit2 := 11 - (sum2 % 11);
  IF digit2 >= 10 THEN
    digit2 := 0;
  END IF;
  
  -- Verificar se os dígitos conferem
  RETURN (substring(cpf, 10, 1)::INTEGER = digit1) AND (substring(cpf, 11, 1)::INTEGER = digit2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar função handle_auth_user_created para incluir novos campos
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
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