-- Corrigir dados inconsistentes de planos anuais
-- Identificar e corrigir subscriptions que são realmente anuais mas estão marcadas como monthly

UPDATE public.poupeja_subscriptions 
SET 
  plan_type = 'annual',
  plan_value = 538.92,
  updated_at = NOW()
WHERE status = 'active'
  AND plan_type = 'monthly'
  AND current_period_end > current_period_start + INTERVAL '6 months'
  AND plan_value = 49.90;

-- Agora usar o trigger para sincronizar os dados dos usuários
-- Forçar a execução do trigger atualizando as subscriptions corrigidas
UPDATE public.poupeja_subscriptions 
SET updated_at = NOW()
WHERE status = 'active'
  AND plan_type = 'annual'
  AND current_period_end > current_period_start + INTERVAL '6 months';

-- Verificar resultado
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
ORDER BY s.current_period_end DESC;