-- Primeiro, vamos resolver as duplicatas de telefone existentes
-- Limpar um dos telefones duplicados (manter apenas um)
UPDATE public.poupeja_users 
SET phone = NULL 
WHERE phone = '55553799999' 
AND id != (
  SELECT id FROM public.poupeja_users 
  WHERE phone = '55553799999' 
  ORDER BY created_at ASC 
  LIMIT 1
);

-- Criar índice único para email (garantir emails únicos)
CREATE UNIQUE INDEX CONCURRENTLY idx_poupeja_users_email_unique 
ON public.poupeja_users (email);

-- Criar índice único para phone quando não for nulo (garantir telefones únicos)
CREATE UNIQUE INDEX CONCURRENTLY idx_poupeja_users_phone_unique 
ON public.poupeja_users (phone) 
WHERE phone IS NOT NULL;

-- Verificar se o CPF já tem restrição única (deve manter)
-- O índice idx_poupeja_users_cpf já existe e é único, então está correto

-- Adicionar comentários para documentar as restrições
COMMENT ON INDEX idx_poupeja_users_email_unique IS 'Garante unicidade dos emails dos usuários';
COMMENT ON INDEX idx_poupeja_users_phone_unique IS 'Garante unicidade dos telefones dos usuários (quando não nulo)';
COMMENT ON INDEX idx_poupeja_users_cpf IS 'Garante unicidade dos CPFs dos usuários';