-- Fix the subscription data for fernando.testerenda12@gmail.com
-- Update the subscription plan_type to annual based on stripe_subscription_id
UPDATE poupeja_subscriptions 
SET plan_type = 'annual',
    updated_at = NOW()
WHERE stripe_subscription_id = 'sub_1S4taoGy0L2Ot2BSwisLLTvG';

-- Update the user's current plan type to match
UPDATE poupeja_users 
SET current_plan_type = 'annual',
    updated_at = NOW()
WHERE email = 'fernando.testerenda12@gmail.com' 
  AND plan_value = 538.92;