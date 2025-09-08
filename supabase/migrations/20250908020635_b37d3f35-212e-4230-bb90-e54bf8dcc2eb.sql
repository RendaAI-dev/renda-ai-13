-- Adicionar coluna plan_value na tabela poupeja_subscriptions
ALTER TABLE public.poupeja_subscriptions 
ADD COLUMN IF NOT EXISTS plan_value NUMERIC;

-- Comentário da coluna
COMMENT ON COLUMN public.poupeja_subscriptions.plan_value IS 'Valor do plano em reais (calculado a partir do unitAmount do Stripe)';