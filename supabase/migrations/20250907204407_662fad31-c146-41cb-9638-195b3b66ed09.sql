-- Corrigir problema de segurança: Habilitar RLS na tabela address_backup
ALTER TABLE public.address_backup ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para a tabela address_backup (apenas administradores podem acessar)
CREATE POLICY "Only admins can view address backup" 
ON public.address_backup 
FOR SELECT 
USING (is_admin());

-- Remover a coluna address da tabela poupeja_users (agora que temos os campos separados)
ALTER TABLE public.poupeja_users DROP COLUMN IF EXISTS address;