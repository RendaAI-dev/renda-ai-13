-- Etapa 1: Corrigir o trigger e garantir que está ativo
DROP TRIGGER IF EXISTS auth_user_created_trigger ON auth.users;

-- Recriar o trigger
CREATE TRIGGER auth_user_created_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_created();

-- Etapa 2: Identificar e resolver duplicatas de CPF antes da correção
-- Primeiro, vamos ver quais CPFs estão duplicados
UPDATE public.poupeja_users 
SET cpf = NULL 
WHERE cpf IN (
  SELECT cpf 
  FROM public.poupeja_users 
  WHERE cpf IS NOT NULL 
  GROUP BY cpf 
  HAVING COUNT(*) > 1
)
AND id NOT IN (
  SELECT DISTINCT ON (cpf) id 
  FROM public.poupeja_users 
  WHERE cpf IS NOT NULL 
  ORDER BY cpf, created_at ASC
);

-- Etapa 3: Criar função para corrigir dados faltantes (versão segura)
CREATE OR REPLACE FUNCTION public.fix_missing_user_data_safe()
RETURNS TABLE(fixed_count integer, details text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cnt INTEGER := 0;
  user_record RECORD;
  cpf_to_update TEXT;
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
    -- Extrair CPF do metadata
    cpf_to_update := TRIM(COALESCE(user_record.raw_user_meta_data->>'cpf', ''));
    
    -- Verificar se o CPF já existe (só atualizar se não existir)
    IF cpf_to_update != '' AND NOT EXISTS (
      SELECT 1 FROM public.poupeja_users WHERE cpf = cpf_to_update AND id != user_record.id
    ) THEN
      -- CPF é único, pode atualizar
      UPDATE public.poupeja_users 
      SET 
        cpf = CASE WHEN cpf IS NULL THEN cpf_to_update ELSE cpf END,
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
    ELSE
      -- CPF duplicado, atualizar apenas os outros campos
      UPDATE public.poupeja_users 
      SET 
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
    END IF;
  END LOOP;
  
  fixed_count := cnt;
  details := format('Corrigidos %s usuários com dados faltantes', cnt);
  RETURN NEXT;
END;
$$;

-- Executar a correção segura
SELECT * FROM public.fix_missing_user_data_safe();