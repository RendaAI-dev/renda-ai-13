CREATE OR REPLACE FUNCTION public.buscar_cadastro_por_email(p_email text)
RETURNS TABLE(user_id uuid, email text, subscription_status text, plan_type text, current_period_end timestamp with time zone) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id AS user_id,
        u.email,
        s.status AS subscription_status,
        s.plan_type,
        s.current_period_end
    FROM
        public.poupeja_users u
    LEFT JOIN
        public.poupeja_subscriptions s
        ON u.id = s.user_id AND s.status = 'active'
    WHERE
        u.email = p_email;
END;
$$ LANGUAGE plpgsql;