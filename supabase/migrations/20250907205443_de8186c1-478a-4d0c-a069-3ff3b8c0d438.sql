-- Verificar se existe o trigger correto na tabela auth.users
DO $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    -- Verificar se o trigger existe
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'auth_user_created_trigger' 
        AND tgrelid = 'auth.users'::regclass
    ) INTO trigger_exists;
    
    -- Se não existir, criar o trigger
    IF NOT trigger_exists THEN
        CREATE TRIGGER auth_user_created_trigger
        AFTER INSERT ON auth.users
        FOR EACH ROW 
        EXECUTE FUNCTION public.handle_auth_user_created();
        
        RAISE NOTICE 'Trigger auth_user_created_trigger criado com sucesso';
    ELSE
        RAISE NOTICE 'Trigger auth_user_created_trigger já existe';
    END IF;
END $$;