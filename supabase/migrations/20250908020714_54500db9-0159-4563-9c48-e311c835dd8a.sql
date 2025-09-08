-- ==================== CORREÇÃO DA SINCRONIZAÇÃO DE PLANOS - PARTE 2 ====================

-- Etapa 1: Corrigir a função sync_user_current_plan para usar plan_value real
CREATE OR REPLACE FUNCTION public.sync_user_current_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Atualizar o plano atual baseado no plan_value real da subscription
  UPDATE public.poupeja_users 
  SET 
    current_plan_type = CASE 
      WHEN NEW.status = 'active' THEN NEW.plan_type
      ELSE 'free'
    END,
    plan_value = CASE 
      WHEN NEW.status = 'active' THEN NEW.plan_value
      ELSE NULL
    END,
    updated_at = NOW()
  WHERE id = NEW.user_id;
  
  -- Log da atualização
  RAISE NOTICE '[SYNC_USER_PLAN] Updated user % - plan_type: %, plan_value: %, status: %', 
    NEW.user_id, NEW.plan_type, NEW.plan_value, NEW.status;
  
  RETURN NEW;
END;
$$;

-- Etapa 2: Criar função para corrigir dados existentes de subscriptions
CREATE OR REPLACE FUNCTION public.fix_subscription_plan_sync()
RETURNS TABLE(fixed_users integer, details text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  cnt INTEGER := 0;
  sub_record RECORD;
BEGIN
  -- Primeiro, vamos popular os plan_value das subscriptions existentes baseado no plan_type
  -- Para subscriptions que não têm plan_value mas têm plan_type
  UPDATE public.poupeja_subscriptions 
  SET plan_value = CASE 
    WHEN plan_type = 'monthly' THEN 49.90
    WHEN plan_type = 'annual' THEN 538.92
    ELSE NULL
  END
  WHERE plan_value IS NULL AND plan_type IS NOT NULL;

  -- Processar todas as subscriptions ativas
  FOR sub_record IN
    SELECT 
      s.user_id,
      s.plan_type,
      s.plan_value,
      s.status,
      u.current_plan_type,
      u.plan_value as user_plan_value
    FROM public.poupeja_subscriptions s
    JOIN public.poupeja_users u ON s.user_id = u.id
    WHERE s.status = 'active'
    AND s.current_period_end > NOW()
    AND (
      u.current_plan_type != s.plan_type OR 
      u.plan_value != s.plan_value OR
      u.current_plan_type = 'free'
    )
  LOOP
    -- Atualizar o usuário com os dados corretos da subscription
    UPDATE public.poupeja_users 
    SET 
      current_plan_type = sub_record.plan_type,
      plan_value = sub_record.plan_value,
      updated_at = NOW()
    WHERE id = sub_record.user_id;
    
    cnt := cnt + 1;
    
    RAISE NOTICE '[FIX_SUBSCRIPTION_SYNC] Fixed user % - %->%, plan_value: %', 
      sub_record.user_id, sub_record.current_plan_type, sub_record.plan_type, sub_record.plan_value;
  END LOOP;
  
  -- Garantir que usuários sem subscription ativa tenham plano 'free'
  UPDATE public.poupeja_users 
  SET 
    current_plan_type = 'free',
    plan_value = NULL,
    updated_at = NOW()
  WHERE id NOT IN (
    SELECT user_id FROM public.poupeja_subscriptions 
    WHERE status = 'active' AND current_period_end > NOW()
  )
  AND current_plan_type != 'free';
  
  fixed_users := cnt;
  details := format('Fixed %s users with active subscriptions', cnt);
  RETURN NEXT;
END;
$$;

-- Etapa 3: Recriar o trigger para garantir que está funcionando
DROP TRIGGER IF EXISTS sync_user_plan_on_subscription_change ON public.poupeja_subscriptions;

CREATE TRIGGER sync_user_plan_on_subscription_change
  AFTER INSERT OR UPDATE ON public.poupeja_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_current_plan();

-- Etapa 4: Executar a correção dos dados existentes
SELECT * FROM public.fix_subscription_plan_sync();