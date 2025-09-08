-- Corrigir a detecção do plan_type baseado no plan_value
-- Primeiro, vamos corrigir os dados existentes
UPDATE public.poupeja_users 
SET current_plan_type = CASE 
    WHEN plan_value = 538.92 THEN 'annual'
    WHEN plan_value = 49.90 THEN 'monthly'
    WHEN subscription_status = 'active' AND plan_value IS NULL THEN 'monthly' -- fallback
    ELSE 'free'
END
WHERE id = '66ff1be3-ddd4-48ad-af5a-eb64a439a7fb';

-- Agora vamos recriar a função get_user_subscription_status para retornar o tipo correto
DROP FUNCTION IF EXISTS public.get_user_subscription_status(uuid);

CREATE OR REPLACE FUNCTION public.get_user_subscription_status(p_user_id uuid DEFAULT auth.uid())
 RETURNS TABLE(subscription_id text, status text, plan_type text, current_period_end timestamp with time zone, is_active boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    u.stripe_subscription_id::text as subscription_id,
    u.subscription_status as status,
    CASE 
      WHEN u.plan_value = 538.92 THEN 'annual'
      WHEN u.plan_value = 49.90 THEN 'monthly'
      WHEN u.subscription_status = 'active' AND u.plan_value IS NULL THEN 'monthly'
      ELSE 'free'
    END as plan_type,
    u.current_period_end,
    (u.subscription_status = 'active' AND u.current_period_end > NOW()) as is_active
  FROM public.poupeja_users u
  WHERE u.id = p_user_id;
END;
$function$;