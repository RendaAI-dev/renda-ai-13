-- Execute fix for existing users with missing data
DO $$
DECLARE
  cnt INTEGER := 0;
  user_record RECORD;
BEGIN
  -- Fix existing users with missing data
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
    -- Update missing fields for this user
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
  
  RAISE NOTICE 'Corrigidos % usuários com dados faltantes', cnt;
END $$;