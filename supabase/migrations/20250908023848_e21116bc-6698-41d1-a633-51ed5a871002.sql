-- Corrigir dados inconsistentes de planos
-- Atualizar plan_type baseado no plan_value
UPDATE public.poupeja_users 
SET 
  current_plan_type = CASE 
    WHEN plan_value = 49.90 THEN 'monthly'
    WHEN plan_value = 538.92 THEN 'annual'
    WHEN plan_value IS NULL THEN 'free'
    ELSE current_plan_type
  END,
  updated_at = NOW()
WHERE 
  (plan_value = 49.90 AND current_plan_type != 'monthly') OR
  (plan_value = 538.92 AND current_plan_type != 'annual') OR
  (plan_value IS NULL AND current_plan_type != 'free');