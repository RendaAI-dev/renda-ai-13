-- Add unique constraints to poupeja_subscriptions table

-- Add unique constraint for stripe_subscription_id (one subscription per Stripe ID)
-- Drop constraint if exists first, then add it
ALTER TABLE public.poupeja_subscriptions 
DROP CONSTRAINT IF EXISTS poupeja_subscriptions_stripe_subscription_id_unique;

ALTER TABLE public.poupeja_subscriptions 
ADD CONSTRAINT poupeja_subscriptions_stripe_subscription_id_unique 
UNIQUE (stripe_subscription_id);

-- Add unique constraint for user_id (one active subscription per user)
-- Drop constraint if exists first, then add it
ALTER TABLE public.poupeja_subscriptions 
DROP CONSTRAINT IF EXISTS poupeja_subscriptions_user_id_unique;

ALTER TABLE public.poupeja_subscriptions 
ADD CONSTRAINT poupeja_subscriptions_user_id_unique 
UNIQUE (user_id);