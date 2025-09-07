-- Adicionar coluna plan_value à tabela poupeja_users
ALTER TABLE public.poupeja_users 
ADD COLUMN plan_value DECIMAL(10,2) DEFAULT NULL;

-- Adicionar comentário para documentar o propósito da coluna
COMMENT ON COLUMN public.poupeja_users.plan_value IS 'Valor específico que o usuário paga pelo plano atual (em reais)';

-- Sincronizar valores existentes baseado nas configurações atuais
UPDATE public.poupeja_users 
SET plan_value = CASE 
  WHEN current_plan_type = 'monthly' THEN 49.90
  WHEN current_plan_type = 'annual' THEN 538.92
  ELSE NULL
END
WHERE current_plan_type IN ('monthly', 'annual');

-- Atualizar trigger existente para incluir sincronização do plan_value
CREATE OR REPLACE FUNCTION public.sync_user_current_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Atualizar o plano atual e valor na tabela poupeja_users
  UPDATE public.poupeja_users 
  SET 
    current_plan_type = CASE 
      WHEN NEW.status = 'active' THEN NEW.plan_type
      ELSE 'free'
    END,
    plan_value = CASE 
      WHEN NEW.status = 'active' THEN 
        CASE NEW.plan_type
          WHEN 'monthly' THEN 49.90
          WHEN 'annual' THEN 538.92
          ELSE NULL
        END
      ELSE NULL
    END
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$function$;