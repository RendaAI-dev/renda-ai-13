-- Função para atualizar o valor atual de uma meta
CREATE OR REPLACE FUNCTION public.update_goal_amount(p_goal_id UUID, p_amount_change NUMERIC)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_amount NUMERIC;
BEGIN
  -- Atualizar o valor atual da meta
  UPDATE public.poupeja_goals
  SET current_amount = current_amount + p_amount_change
  WHERE id = p_goal_id
  RETURNING current_amount INTO v_current_amount;
  
  -- Retornar o novo valor atual
  RETURN v_current_amount;
END;
$$;

-- Função para criar a função update_goal_amount (usada pela Edge Function)
CREATE OR REPLACE FUNCTION public.create_update_goal_amount_function()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Criar a função update_goal_amount
  EXECUTE $FUNC$
  CREATE OR REPLACE FUNCTION public.update_goal_amount(p_goal_id UUID, p_amount_change NUMERIC)
  RETURNS NUMERIC
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $INNER$
  DECLARE
    v_current_amount NUMERIC;
  BEGIN
    -- Atualizar o valor atual da meta
    UPDATE public.poupeja_goals
    SET current_amount = current_amount + p_amount_change
    WHERE id = p_goal_id
    RETURNING current_amount INTO v_current_amount;
    
    -- Retornar o novo valor atual
    RETURN v_current_amount;
  END;
  $INNER$;
  $FUNC$;
  
  -- Conceder permissões
  GRANT EXECUTE ON FUNCTION public.update_goal_amount(UUID, NUMERIC) TO authenticated;
  GRANT EXECUTE ON FUNCTION public.update_goal_amount(UUID, NUMERIC) TO service_role;
  
  RAISE NOTICE 'Função update_goal_amount criada com sucesso';
END;
$$;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.create_update_goal_amount_function() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_update_goal_amount_function() TO service_role;