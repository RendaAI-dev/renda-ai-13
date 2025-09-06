
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Grant admin access function called");

    // Get auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Unauthorized: No authorization header');
    }

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('Missing required environment variables');
    }

    // Create admin client with service role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Create user client to get current user
    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      console.error('Failed to get user:', userError);
      throw new Error('Unauthorized: Invalid user session');
    }

    console.log("Granting admin access to authenticated user");

    // Insert or update user role using service role client
    const { data, error } = await adminClient
      .from('user_roles')
      .upsert({ 
        user_id: user.id, 
        role: 'admin' 
      }, { 
        onConflict: 'user_id,role' 
      });

    if (error) {
      console.error('Error granting admin access:', error);
      throw new Error('Failed to grant admin access: ' + error.message);
    }

    console.log("Admin access granted successfully");

    return new Response(JSON.stringify({
      success: true,
      message: "Acesso de administrador concedido com sucesso",
      userId: user.id
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error granting admin access:", error);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message || "Erro interno do servidor"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
