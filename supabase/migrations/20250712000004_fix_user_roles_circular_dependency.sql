-- Fix circular dependency in user_roles policies
-- This fixes the "Database error granting user" issue during login

-- Drop the problematic circular policy
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Create a simpler policy for now - we'll manage admin operations through service role functions
-- This prevents circular dependency during authentication
CREATE POLICY "Service role can manage all roles" ON public.user_roles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Allow users to insert their own basic user role (not admin)
CREATE POLICY "Users can insert basic role" ON public.user_roles
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id AND role = 'user');

-- Create a temporary function to grant admin access that bypasses RLS
CREATE OR REPLACE FUNCTION public.grant_admin_access_to_user(target_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;
  
  -- Insert admin role (with SECURITY DEFINER, this bypasses RLS)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN TRUE;
END;
$$;

-- Grant admin access to the existing admin user (condicional)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@admin.com') THEN
    PERFORM public.grant_admin_access_to_user('admin@admin.com');
    RAISE NOTICE 'Admin access granted to admin@admin.com';
  ELSE
    RAISE NOTICE 'User admin@admin.com not found, skipping admin grant';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error granting admin access: %', SQLERRM;
END $$;