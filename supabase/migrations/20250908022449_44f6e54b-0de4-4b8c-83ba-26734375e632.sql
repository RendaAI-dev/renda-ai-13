-- Etapa 1: Adicionar colunas de subscription à tabela poupeja_users
ALTER TABLE public.poupeja_users 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS current_period_start TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancel_at_period_end BOOLEAN DEFAULT false;

-- Etapa 2: Migrar dados existentes da tabela poupeja_subscriptions para poupeja_users
UPDATE public.poupeja_users 
SET 
  stripe_customer_id = s.stripe_customer_id,
  stripe_subscription_id = s.stripe_subscription_id,
  subscription_status = s.status,
  current_period_start = s.current_period_start,
  current_period_end = s.current_period_end,
  cancel_at_period_end = s.cancel_at_period_end
FROM public.poupeja_subscriptions s
WHERE poupeja_users.id = s.user_id;

-- Etapa 3: Remover trigger que não será mais necessário
DROP TRIGGER IF EXISTS sync_user_plan_trigger ON public.poupeja_subscriptions;

-- Etapa 4: Remover função que não será mais necessária
DROP FUNCTION IF EXISTS public.sync_user_current_plan();

-- Etapa 5: Dropar a tabela poupeja_subscriptions (após confirmar que os dados foram migrados)
-- Primeiro verificar se a migração foi bem-sucedida
DO $$
DECLARE
  subscription_count INTEGER;
  user_subscription_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO subscription_count FROM public.poupeja_subscriptions;
  SELECT COUNT(*) INTO user_subscription_count FROM public.poupeja_users WHERE stripe_subscription_id IS NOT NULL;
  
  IF subscription_count = user_subscription_count THEN
    RAISE NOTICE 'Migration successful: % subscriptions migrated to users table', subscription_count;
    -- Dropar a tabela
    DROP TABLE IF EXISTS public.poupeja_subscriptions CASCADE;
    RAISE NOTICE 'poupeja_subscriptions table dropped successfully';
  ELSE
    RAISE EXCEPTION 'Migration verification failed: % subscriptions vs % users with subscriptions', subscription_count, user_subscription_count;
  END IF;
END $$;