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
  console.log(`[GET-PUBLIC-SETTINGS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Create Supabase client with service role key (no auth required for public settings)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Parse request to get category filter (optional)
    const url = new URL(req.url);
    const category = url.searchParams.get("category");
    
    // Only allow access to public categories
    const publicCategories = ["pricing", "branding", "contact"];
    
    let query = supabaseClient
      .from("poupeja_settings")
      .select("category, key, value, value_type, description, updated_at")
      .in("category", publicCategories)
      .eq("encrypted", false); // Only non-encrypted settings

    if (category && publicCategories.includes(category)) {
      query = query.eq("category", category);
      logStep("Filtering by category", { category });
    }

    const { data: settings, error: settingsError } = await query.order("category", { ascending: true }).order("key", { ascending: true });

    if (settingsError) {
      logStep("Error fetching settings", { error: settingsError.message });
      throw new Error(`Failed to fetch settings: ${settingsError.message}`);
    }

    logStep("Settings fetched successfully", { count: settings?.length || 0 });

    // Process settings
    const processedSettings: Record<string, any> = {};

    for (const setting of settings || []) {
      if (!processedSettings[setting.category]) {
        processedSettings[setting.category] = {};
      }

      let value = setting.value;

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
    logStep("ERROR in get-public-settings", { message: errorMessage });
    
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
