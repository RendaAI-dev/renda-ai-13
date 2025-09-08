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

-- Etapa 3: Remover função e trigger com CASCADE
DROP FUNCTION IF EXISTS public.sync_user_current_plan() CASCADE;

-- Etapa 4: Verificar migração e dropar tabela
DO $$
DECLARE
  subscription_count INTEGER;
  user_subscription_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO subscription_count FROM public.poupeja_subscriptions;
  SELECT COUNT(*) INTO user_subscription_count FROM public.poupeja_users WHERE stripe_subscription_id IS NOT NULL;
  
  RAISE NOTICE 'Subscriptions in old table: %, Users with subscriptions: %', subscription_count, user_subscription_count;
  
  -- Dropar a tabela
  DROP TABLE IF EXISTS public.poupeja_subscriptions CASCADE;
  RAISE NOTICE 'poupeja_subscriptions table dropped successfully';
END $$;