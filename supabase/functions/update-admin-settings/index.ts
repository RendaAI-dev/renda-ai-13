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
  console.log(`[UPDATE-ADMIN-SETTINGS] ${step}${detailsStr}`);
};

// Helper function to encrypt sensitive data (basic base64 for now)
const encryptValue = (value: string): string => {
  return btoa(value);
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

    // Parse request body
    const requestBody = await req.json();
    const { category, updates } = requestBody;

    if (!category || !updates || typeof updates !== "object") {
      throw new Error("Invalid request: category and updates object are required");
    }

    logStep("Request parsed", { category, updateCount: Object.keys(updates).length });

    // Sensitive keys that should be encrypted
    const sensitiveKeys = [
      "secret_key", 
      "webhook_secret", 
      "stripe_secret_key",
      "stripe_webhook_secret"
    ];

    const results = [];
    const errors = [];

    // Process each update
    for (const [key, value] of Object.entries(updates)) {
      try {
        logStep("Processing update", { category, key });

        // Determine if this key should be encrypted
        const shouldEncrypt = sensitiveKeys.includes(key.toLowerCase());
        
        // Determine value type
        let valueType = "string";
        let processedValue = String(value);

        if (typeof value === "number") {
          valueType = "number";
          processedValue = String(value);
        } else if (typeof value === "boolean") {
          valueType = "boolean";
          processedValue = String(value);
        } else if (typeof value === "object" && value !== null) {
          valueType = "json";
          processedValue = JSON.stringify(value);
        }

        // Encrypt if needed
        if (shouldEncrypt && processedValue) {
          processedValue = encryptValue(processedValue);
          logStep("Value encrypted", { category, key });
        }

        // Use the upsert_setting function
        const { data: upsertData, error: upsertError } = await supabaseClient
          .rpc("upsert_setting", {
            p_category: category,
            p_key: key,
            p_value: processedValue,
            p_value_type: valueType,
            p_encrypted: shouldEncrypt,
            p_description: `${category} - ${key} configuration`
          });

        if (upsertError) {
          logStep("Error upserting setting", { category, key, error: upsertError.message });
          errors.push({ key, error: upsertError.message });
        } else {
          logStep("Setting updated successfully", { category, key, settingId: upsertData });
          results.push({ key, settingId: upsertData, encrypted: shouldEncrypt });
        }

      } catch (settingError) {
        const errorMessage = settingError instanceof Error ? settingError.message : String(settingError);
        logStep("Error processing setting", { category, key, error: errorMessage });
        errors.push({ key, error: errorMessage });
      }
    }

    logStep("Update process completed", { 
      successCount: results.length, 
      errorCount: errors.length 
    });

    const response = {
      success: errors.length === 0,
      category,
      updated: results,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: errors.length > 0 ? 207 : 200, // 207 Multi-Status if some failed
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in update-admin-settings", { message: errorMessage });
    
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