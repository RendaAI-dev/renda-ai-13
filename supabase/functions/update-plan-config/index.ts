
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
    console.log("Update plan config function called");
    console.log("Request method:", req.method);

    const body = await req.json();
    const {
      monthlyPriceId,
      annualPriceId,
      monthlyPrice,
      annualPrice,
      annualOriginalPrice,
      annualSavings,
      contactPhone
    } = body;

    console.log("Updating plan configuration with:", {
      monthlyPriceId,
      annualPriceId,
      monthlyPrice,
      annualPrice,
      annualOriginalPrice,
      annualSavings,
      contactPhone
    });

    // Get auth header to verify user is authenticated
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      throw new Error('Unauthorized: No authorization header');
    }

    console.log("Authorization header present");

    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log("Environment variables:", {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceRoleKey: !!serviceRoleKey
    });

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing required environment variables');
      throw new Error('Missing required environment variables');
    }

    // Create Supabase client with service role to update settings
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    
    // Create client for user verification
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('Failed to get user:', userError);
      throw new Error('Unauthorized: Invalid user session');
    }

    console.log("User authenticated successfully");

    // Check if user has admin role
    const { data: hasAdminRole, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    console.log("Admin role check:", { hasAdminRole, roleError });

    if (roleError) {
      console.error('Error checking admin role:', roleError);
      throw new Error('Failed to verify admin permissions');
    }

    if (!hasAdminRole) {
      console.error('User does not have admin permissions');
      throw new Error('Unauthorized: User does not have admin permissions');
    }

    console.log("User has admin permissions, proceeding with plan config update");

    // Map of settings to update in database
    const settingsToUpdate = [
      { key: 'stripe_price_id_monthly', value: monthlyPriceId },
      { key: 'stripe_price_id_annual', value: annualPriceId },
      { key: 'plan_price_monthly', value: monthlyPrice },
      { key: 'plan_price_annual', value: annualPrice },
      { key: 'contact_phone', value: contactPhone }
    ];

    let updatedSettings = [];
    let errors = [];

    console.log("Updating settings in database via upsert_setting RPC");
    
    // Update each setting using the upsert_setting RPC
    for (const { key, value } of settingsToUpdate) {
      if (value && value.toString().trim() !== '') {
        try {
          console.log(`Updating setting: ${key} = ${value}`);
          
          const { data, error } = await supabaseAdmin.rpc('upsert_setting', {
            p_key: key,
            p_value: value.toString(),
            p_description: `Plan configuration: ${key}`
          });

          if (error) {
            console.error(`Failed to update setting ${key}:`, error);
            errors.push(`Failed to update ${key}: ${error.message}`);
          } else {
            console.log(`Successfully updated setting: ${key}`);
            updatedSettings.push(key);
          }
        } catch (error) {
          console.error(`Error updating setting ${key}:`, error);
          errors.push(`Error updating ${key}: ${error.message}`);
        }
      }
    }

    if (errors.length > 0) {
      console.error('Some settings failed to update:', errors);
      return new Response(JSON.stringify({
        success: false,
        error: "Algumas configurações falharam ao atualizar",
        details: errors,
        partialSuccess: updatedSettings.length > 0,
        updatedSettings
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const response = {
      success: true,
      message: "Configurações de plano salvas com sucesso no banco de dados",
      environment: "database",
      updatedSettings,
      updatedConfig: {
        prices: {
          monthly: {
            priceId: monthlyPriceId,
            price: monthlyPrice,
            displayPrice: `R$ ${monthlyPrice}`,
          },
          annual: {
            priceId: annualPriceId,
            price: annualPrice,
            originalPrice: annualOriginalPrice,
            savings: annualSavings,
            displayPrice: `R$ ${annualPrice}`,
            displayOriginalPrice: `R$ ${annualOriginalPrice}`,
            displaySavings: `Economize ${annualSavings}%`,
          }
        },
        contact: {
          phone: contactPhone
        }
      }
    };

    console.log("Plan configuration successfully saved:", response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error updating plan configuration:", error);
    
    let errorMessage = error.message || "Erro interno do servidor";
    let statusCode = 500;

    // Handle specific error cases
    if (errorMessage.includes('Unauthorized')) {
      statusCode = 401;
    }

    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage,
      details: "Verifique se você tem permissões de administrador"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: statusCode,
    });
  }
});
