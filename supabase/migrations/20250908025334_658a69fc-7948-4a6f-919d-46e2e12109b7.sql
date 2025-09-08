-- Corrigir diretamente o plan_type para o usuário específico
UPDATE public.poupeja_users 
SET current_plan_type = 'annual'
WHERE email = 'fernando.testerenda18@gmail.com' 
AND plan_value = 538.92;

-- Também vamos corrigir a função update_subscription_status para garantir que funcione corretamente
DROP FUNCTION IF EXISTS public.update_subscription_status(text, text, timestamp with time zone, timestamp with time zone, boolean);

CREATE OR REPLACE FUNCTION public.update_subscription_status(
  p_stripe_subscription_id text, 
  p_status text, 
  p_current_period_start timestamp with time zone DEFAULT NULL::timestamp with time zone, 
  p_current_period_end timestamp with time zone DEFAULT NULL::timestamp with time zone, 
  p_cancel_at_period_end boolean DEFAULT NULL::boolean
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_id_result UUID;
  calculated_plan_type TEXT;
BEGIN
  -- Calcular o plan_type baseado no plan_value atual
  SELECT 
    CASE 
      WHEN plan_value = 538.92 THEN 'annual'
      WHEN plan_value = 49.90 THEN 'monthly'
      ELSE 'free'
    END INTO calculated_plan_type
  FROM public.poupeja_users
  WHERE stripe_subscription_id = p_stripe_subscription_id;

  -- Atualizar os dados
  UPDATE public.poupeja_users
  SET 
    subscription_status = p_status,
    current_plan_type = CASE 
      WHEN p_status = 'active' THEN calculated_plan_type
      ELSE 'free'
    END,
    current_period_start = COALESCE(p_current_period_start, current_period_start),
    current_period_end = COALESCE(p_current_period_end, current_period_end),
    cancel_at_period_end = COALESCE(p_cancel_at_period_end, cancel_at_period_end),
    updated_at = NOW()
  WHERE stripe_subscription_id = p_stripe_subscription_id
  RETURNING id INTO user_id_result;
  
  RETURN user_id_result;
END;
$function$;