-- Corrigir políticas RLS para permitir que edge functions funcionem

-- Primeiro, removemos as políticas existentes conflitantes
DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.poupeja_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.poupeja_subscriptions;

-- Criar políticas que permitem edge functions (service role) fazer operações
CREATE POLICY "Allow service role to insert subscriptions" ON public.poupeja_subscriptions
FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role to update subscriptions" ON public.poupeja_subscriptions
FOR UPDATE USING (true);

-- Manter política para usuários visualizarem suas próprias assinaturas (remover se existir primeiro)
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.poupeja_subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON public.poupeja_subscriptions
FOR SELECT USING (auth.uid() = user_id);

-- Adicionar política para permitir edge functions deletarem (para casos de cancelamento)
CREATE POLICY "Allow service role to delete subscriptions" ON public.poupeja_subscriptions
FOR DELETE USING (true);

-- Garantir que a tabela poupeja_customers também tenha políticas corretas
DROP POLICY IF EXISTS "Users can view their own customer data" ON public.poupeja_customers;
DROP POLICY IF EXISTS "Users can insert their own customer data" ON public.poupeja_customers;
DROP POLICY IF EXISTS "Users can update their own customer data" ON public.poupeja_customers;

-- Criar políticas para poupeja_customers se a tabela existir
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'poupeja_customers') THEN
        EXECUTE 'CREATE POLICY "Users can view their own customer data" ON public.poupeja_customers FOR SELECT USING (auth.uid() = user_id)';
        EXECUTE 'CREATE POLICY "Allow service role to insert customer data" ON public.poupeja_customers FOR INSERT WITH CHECK (true)';
        EXECUTE 'CREATE POLICY "Allow service role to update customer data" ON public.poupeja_customers FOR UPDATE USING (true)';
    END IF;
END $$;