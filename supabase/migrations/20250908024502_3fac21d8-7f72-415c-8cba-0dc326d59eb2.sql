-- Atualizar função get_user_subscription_status para usar poupeja_users
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
    u.current_plan_type as plan_type,
    u.current_period_end,
    (u.subscription_status = 'active' AND u.current_period_end > NOW()) as is_active
  FROM public.poupeja_users u
  WHERE u.id = p_user_id;
END;
$function$;

-- Atualizar função update_subscription_status para usar poupeja_users
CREATE OR REPLACE FUNCTION public.update_subscription_status(p_stripe_subscription_id text, p_status text, p_current_period_start timestamp with time zone DEFAULT NULL::timestamp with time zone, p_current_period_end timestamp with time zone DEFAULT NULL::timestamp with time zone, p_cancel_at_period_end boolean DEFAULT NULL::boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = 'public'
AS $function$
DECLARE
  user_id_result UUID;
BEGIN
  UPDATE public.poupeja_users
  SET 
    subscription_status = p_status,
    current_period_start = COALESCE(p_current_period_start, current_period_start),
    current_period_end = COALESCE(p_current_period_end, current_period_end),
    cancel_at_period_end = COALESCE(p_cancel_at_period_end, cancel_at_period_end),
    updated_at = NOW()
  WHERE stripe_subscription_id = p_stripe_subscription_id
  RETURNING id INTO user_id_result;
  
  RETURN user_id_result;
END;
$function$;