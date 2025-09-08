-- Etapa 1: Corrigir o trigger e garantir que está ativo
DROP TRIGGER IF EXISTS auth_user_created_trigger ON auth.users;

-- Recriar o trigger
CREATE TRIGGER auth_user_created_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- Etapa 2: Resolver duplicatas de CPF e telefone
-- Limpar telefones duplicados (manter apenas o mais antigo)
UPDATE public.poupeja_users 
SET phone = NULL 
WHERE phone IN (
  SELECT phone 
  FROM public.poupeja_users 
  WHERE phone IS NOT NULL 
  GROUP BY phone 
  HAVING COUNT(*) > 1
)
AND id NOT IN (
  SELECT DISTINCT ON (phone) id 
  FROM public.poupeja_users 
  WHERE phone IS NOT NULL 
  ORDER BY phone, created_at ASC
);

-- Etapa 3: Agora aplicar a correção de dados de forma mais conservadora
CREATE OR REPLACE FUNCTION public.apply_user_data_corrections()
RETURNS TABLE(corrected_users integer, details text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cnt INTEGER := 0;
  user_record RECORD;
  new_cpf TEXT;
  new_phone TEXT;
BEGIN
  -- Processar cada usuário individualmente
  FOR user_record IN
    SELECT 
      au.id, 
      au.email,
      au.raw_user_meta_data,
      pu.cpf, pu.phone, pu.birth_date, pu.cep, pu.logradouro, pu.cidade
    FROM auth.users au
    JOIN public.poupeja_users pu ON au.id = pu.id
    WHERE au.raw_user_meta_data IS NOT NULL
    AND (
      pu.cpf IS NULL OR 
      pu.phone IS NULL OR
      pu.birth_date IS NULL OR 
      pu.cep IS NULL OR 
      pu.logradouro IS NULL OR 
      pu.cidade IS NULL
    )
  LOOP
    -- Extrair e validar CPF
    new_cpf := NULLIF(TRIM(COALESCE(user_record.raw_user_meta_data->>'cpf', '')), '');
    IF new_cpf IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.poupeja_users 
      WHERE cpf = new_cpf AND id != user_record.id
    ) THEN
      new_cpf := NULL; -- CPF duplicado, não usar
    END IF;

    -- Extrair e validar telefone
    new_phone := NULLIF(TRIM(COALESCE(user_record.raw_user_meta_data->>'phone', '')), '');
    IF new_phone IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.poupeja_users 
      WHERE phone = new_phone AND id != user_record.id
    ) THEN
      new_phone := NULL; -- Telefone duplicado, não usar
    END IF;

    -- Atualizar apenas se tivermos dados válidos
    UPDATE public.poupeja_users 
    SET 
      cpf = COALESCE(cpf, new_cpf),
      phone = COALESCE(phone, new_phone),
      birth_date = COALESCE(
        birth_date, 
        CASE 
          WHEN user_record.raw_user_meta_data->>'birth_date' IS NOT NULL
          THEN (user_record.raw_user_meta_data->>'birth_date')::DATE
          ELSE NULL
        END
      ),
      cep = COALESCE(cep, NULLIF(TRIM(COALESCE(user_record.raw_user_meta_data->>'cep', '')), '')),
      logradouro = COALESCE(logradouro, NULLIF(TRIM(COALESCE(user_record.raw_user_meta_data->>'logradouro', '')), '')),
      numero = COALESCE(numero, NULLIF(TRIM(COALESCE(user_record.raw_user_meta_data->>'numero', '')), '')),
      complemento = COALESCE(complemento, NULLIF(TRIM(COALESCE(user_record.raw_user_meta_data->>'complemento', '')), '')),
      bairro = COALESCE(bairro, NULLIF(TRIM(COALESCE(user_record.raw_user_meta_data->>'bairro', '')), '')),
      cidade = COALESCE(cidade, NULLIF(TRIM(COALESCE(user_record.raw_user_meta_data->>'cidade', '')), '')),
      estado = COALESCE(estado, NULLIF(TRIM(COALESCE(user_record.raw_user_meta_data->>'estado', '')), '')),
      updated_at = NOW()
    WHERE id = user_record.id;
    
    cnt := cnt + 1;
  END LOOP;
  
  corrected_users := cnt;
  details := format('Processados %s usuários com dados do metadata', cnt);
  RETURN NEXT;
END;
$$;

-- Executar a correção
SELECT * FROM public.apply_user_data_corrections();