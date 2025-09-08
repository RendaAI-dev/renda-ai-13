-- Corrigir subscription específica que não foi pega no update anterior
-- Casos onde plan_value é NULL mas deveria ser anual baseado na data

UPDATE public.poupeja_subscriptions 
SET 
  plan_type = 'annual',
  plan_value = 538.92,
  updated_at = NOW()
WHERE status = 'active'
  AND (plan_value IS NULL OR plan_value = 49.90)
  AND current_period_end > current_period_start + INTERVAL '6 months';

-- Forçar trigger para todos os usuários com subscriptions ativas
UPDATE public.poupeja_subscriptions 
SET updated_at = NOW()
WHERE status = 'active'
  AND current_period_end > NOW();

-- Verificar novamente o resultado específico
SELECT 
  u.email,
  u.current_plan_type,
  u.plan_value as user_plan_value,
  s.plan_type as subscription_plan_type,
  s.plan_value as subscription_plan_value,
  s.current_period_end,
  CASE 
    WHEN s.current_period_end > s.current_period_start + INTERVAL '6 months' THEN 'annual'
    ELSE 'monthly'
  END as calculated_plan_type
FROM poupeja_users u 
JOIN poupeja_subscriptions s ON u.id = s.user_id 
WHERE s.status = 'active'
  AND s.current_period_end > NOW()
  AND u.email = 'fernando.testerenda16@gmail.com';