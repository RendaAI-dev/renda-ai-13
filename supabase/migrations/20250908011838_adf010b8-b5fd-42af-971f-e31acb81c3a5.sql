-- Fix the subscription data for fernando.testerenda12@gmail.com
-- Update the subscription plan_type to annual since plan_value is 538.92
UPDATE poupeja_subscriptions 
SET plan_type = 'annual',
    updated_at = NOW()
WHERE stripe_subscription_id = 'sub_1S4taoGy0L2Ot2BSwisLLTvG'
  AND plan_value = 538.92;

-- Update the user's current plan type to match
UPDATE poupeja_users 
SET current_plan_type = 'annual',
    updated_at = NOW()
WHERE email = 'fernando.testerenda12@gmail.com'
  AND plan_value = 538.92;