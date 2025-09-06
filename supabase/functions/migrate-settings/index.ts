import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for enhanced debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MIGRATE-SETTINGS] ${step}${detailsStr}`);
};

// Helper function to encrypt sensitive data (basic base64 for now)
const encryptValue = (value: string): string => {
  return btoa(value);
};

// Mapping of old secret keys to new structure
const secretsMapping = {
  // Branding
  'LOGO_URL': { category: 'branding', key: 'logo_url' },
  'FAVICON_URL': { category: 'branding', key: 'favicon_url' },
  'COMPANY_NAME': { category: 'branding', key: 'company_name' },
  'LOGO_ALT_TEXT': { category: 'branding', key: 'logo_alt_text' },
  
  // Stripe (sensitive)
  'STRIPE_SECRET_KEY': { category: 'stripe', key: 'secret_key', encrypted: true },
  'STRIPE_WEBHOOK_SECRET': { category: 'stripe', key: 'webhook_secret', encrypted: true },
  'STRIPE_PRICE_ID_MONTHLY': { category: 'stripe', key: 'price_id_monthly' },
  'STRIPE_PRICE_ID_ANNUAL': { category: 'stripe', key: 'price_id_annual' },
  
  // Pricing
  'PLAN_PRICE_MONTHLY': { category: 'pricing', key: 'monthly_price', type: 'number' },
  'PLAN_PRICE_ANNUAL': { category: 'pricing', key: 'annual_price', type: 'number' },
  
  // Contact
  'CONTACT_PHONE': { category: 'contact', key: 'phone' },
  'SUPPORT_EMAIL': { category: 'contact', key: 'support_email' },
  'WHATSAPP_MESSAGE': { category: 'contact', key: 'whatsapp_message' },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Migration function started");

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

    // Parse request body for migration options
    const requestBody = await req.json().catch(() => ({}));
    const { forceOverwrite = false, dryRun = false } = requestBody;

    logStep("Migration options", { forceOverwrite, dryRun });

    // Step 1: Fetch current secrets via get-secrets function
    logStep("Fetching current secrets from Management API");
    
    const { data: secretsData, error: secretsError } = await supabaseClient.functions
      .invoke('get-secrets', {
        headers: { Authorization: `Bearer ${token}` }
      });

    if (secretsError) {
      logStep("Error fetching secrets", { error: secretsError });
      throw new Error(`Failed to fetch current secrets: ${secretsError.message}`);
    }

    const currentSecrets = secretsData || {};
    logStep("Current secrets fetched", { count: Object.keys(currentSecrets).length });

    // Step 2: Check what's already in the database
    const { data: existingSettings, error: existingError } = await supabaseClient
      .from("poupeja_settings")
      .select("category, key, value, encrypted");

    if (existingError) {
      logStep("Error fetching existing settings", { error: existingError.message });
      throw new Error(`Failed to fetch existing settings: ${existingError.message}`);
    }

    const existingSettingsMap = new Map();
    existingSettings?.forEach(setting => {
      existingSettingsMap.set(`${setting.category}.${setting.key}`, setting);
    });

    logStep("Existing settings checked", { count: existingSettings?.length || 0 });

    // Step 3: Process migration
    const migrationResults = [];
    const migrationErrors = [];
    let skippedCount = 0;

    for (const [secretKey, secretValue] of Object.entries(currentSecrets)) {
      const mapping = secretsMapping[secretKey as keyof typeof secretsMapping];
      
      if (!mapping) {
        logStep("No mapping found for secret, skipping", { secretKey });
        skippedCount++;
        continue;
      }

      const settingKey = `${mapping.category}.${mapping.key}`;
      const existingSetting = existingSettingsMap.get(settingKey);

      // Skip if already exists and not forcing overwrite
      if (existingSetting && !forceOverwrite) {
        logStep("Setting already exists, skipping", { settingKey });
        skippedCount++;
        continue;
      }

      try {
        let processedValue = String(secretValue || '');
        let valueType = mapping.type || 'string';
        let shouldEncrypt = mapping.encrypted || false;

        // Process value based on type
        if (valueType === 'number' && processedValue) {
          processedValue = String(parseFloat(processedValue));
        }

        // Encrypt if needed
        if (shouldEncrypt && processedValue) {
          processedValue = encryptValue(processedValue);
          logStep("Value encrypted for migration", { secretKey, settingKey });
        }

        // Skip actual database operation if dry run
        if (dryRun) {
          migrationResults.push({
            secretKey,
            category: mapping.category,
            key: mapping.key,
            hasValue: !!secretValue,
            encrypted: shouldEncrypt,
            action: existingSetting ? 'UPDATE' : 'CREATE',
            dryRun: true
          });
          continue;
        }

        // Use the upsert_setting function
        const { data: upsertData, error: upsertError } = await supabaseClient
          .rpc("upsert_setting", {
            p_category: mapping.category,
            p_key: mapping.key,
            p_value: processedValue,
            p_value_type: valueType,
            p_encrypted: shouldEncrypt,
            p_description: `Migrated from secret: ${secretKey}`
          });

        if (upsertError) {
          logStep("Error migrating setting", { secretKey, settingKey, error: upsertError.message });
          migrationErrors.push({ secretKey, settingKey, error: upsertError.message });
        } else {
          logStep("Setting migrated successfully", { secretKey, settingKey, settingId: upsertData });
          migrationResults.push({
            secretKey,
            category: mapping.category,
            key: mapping.key,
            settingId: upsertData,
            encrypted: shouldEncrypt,
            action: existingSetting ? 'UPDATE' : 'CREATE'
          });
        }

      } catch (settingError) {
        const errorMessage = settingError instanceof Error ? settingError.message : String(settingError);
        logStep("Error processing setting migration", { secretKey, settingKey, error: errorMessage });
        migrationErrors.push({ secretKey, settingKey, error: errorMessage });
      }
    }

    logStep("Migration process completed", { 
      migratedCount: migrationResults.length,
      errorCount: migrationErrors.length,
      skippedCount 
    });

    const response = {
      success: migrationErrors.length === 0,
      migrated: migrationResults,
      errors: migrationErrors.length > 0 ? migrationErrors : undefined,
      skipped: skippedCount,
      totalSecrets: Object.keys(currentSecrets).length,
      dryRun,
      forceOverwrite,
      timestamp: new Date().toISOString()
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: migrationErrors.length > 0 ? 207 : 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in migrate-settings", { message: errorMessage });
    
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