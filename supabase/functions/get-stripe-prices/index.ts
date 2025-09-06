import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function for debugging
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GET-STRIPE-PRICES] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    // Initialize Supabase client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    logStep("Supabase client initialized");

    // Fetch Stripe price IDs from poupeja_settings
    const { data, error } = await supabaseClient
      .from("poupeja_settings")
      .select("key, value")
      .in("key", ["stripe_price_id_monthly", "stripe_price_id_annual"]);

    if (error) {
      logStep("ERROR: Failed to fetch settings", { error: error.message });
      throw new Error(`Database error: ${error.message}`);
    }

    logStep("Settings fetched", { count: data?.length });

    if (!data || data.length === 0) {
      logStep("WARNING: No price settings found");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "No Stripe price settings found in database" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Convert array to object
    const priceSettings: { [key: string]: string } = {};
    data.forEach(setting => {
      priceSettings[setting.key] = setting.value;
    });

    logStep("Price settings processed", { settings: priceSettings });

    // Validate that both required price IDs exist
    const monthlyPriceId = priceSettings.stripe_price_id_monthly;
    const annualPriceId = priceSettings.stripe_price_id_annual;

    if (!monthlyPriceId || !annualPriceId) {
      logStep("ERROR: Missing required price IDs", {
        hasMonthly: !!monthlyPriceId,
        hasAnnual: !!annualPriceId
      });
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required Stripe price IDs in database",
          details: {
            monthly_missing: !monthlyPriceId,
            annual_missing: !annualPriceId
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    logStep("Price IDs validated successfully");

    return new Response(
      JSON.stringify({
        success: true,
        prices: {
          monthly: monthlyPriceId,
          annual: annualPriceId
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in get-stripe-prices", { message: errorMessage });
    console.error("Error:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});