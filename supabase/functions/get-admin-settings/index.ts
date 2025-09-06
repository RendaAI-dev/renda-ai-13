import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-ADMIN-SETTINGS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError || userRole?.role !== "admin") {
      logStep("Access denied - user is not admin", { userId: user.id });
      return new Response(JSON.stringify({ error: "Access denied. Admin role required." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    logStep("Admin access verified");

    // Parse request to get category filter (optional)
    // Support both query params and request body
    const url = new URL(req.url);
    let category = url.searchParams.get("category");
    
    // Try to get category from request body if not in query params
    if (!category && req.method === "POST") {
      try {
        const requestBody = await req.json();
        category = requestBody.category;
      } catch {
        // Not a problem if body is not JSON
      }
    }
    
    let query = supabaseClient
      .from("poupeja_settings")
      .select("category, key, value, value_type, encrypted, description, updated_at");

    if (category) {
      query = query.eq("category", category);
      logStep("Filtering by category", { category });
    }

    const { data: settings, error: settingsError } = await query.order("category", { ascending: true }).order("key", { ascending: true });

    if (settingsError) {
      logStep("Error fetching settings", { error: settingsError.message });
      throw new Error(`Failed to fetch settings: ${settingsError.message}`);
    }

    logStep("Settings fetched successfully", { count: settings?.length || 0 });

    // Process settings and decrypt sensitive data
    const processedSettings: Record<string, any> = {};

    for (const setting of settings || []) {
      if (!processedSettings[setting.category]) {
        processedSettings[setting.category] = {};
      }

      let value = setting.value;
      
      // Decrypt if needed (currently just base64 decode - replace with real decryption)
      if (setting.encrypted && value) {
        try {
          value = atob(value);
          logStep("Decrypted setting", { category: setting.category, key: setting.key });
        } catch (error) {
          logStep("Failed to decrypt setting", { category: setting.category, key: setting.key, error });
          // Keep original value if decryption fails
        }
      }

      // Convert value based on type
      if (setting.value_type === "number" && value) {
        value = parseFloat(value);
      } else if (setting.value_type === "boolean" && value) {
        value = value.toLowerCase() === "true";
      } else if (setting.value_type === "json" && value) {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if JSON parse fails
        }
      }

      processedSettings[setting.category][setting.key] = {
        value,
        type: setting.value_type,
        encrypted: setting.encrypted,
        description: setting.description,
        updated_at: setting.updated_at
      };
    }

    logStep("Settings processed and ready to return", { categories: Object.keys(processedSettings) });

    return new Response(JSON.stringify({
      success: true,
      settings: processedSettings,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-admin-settings", { message: errorMessage });
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      success: false,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
