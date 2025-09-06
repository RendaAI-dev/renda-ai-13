
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role for database operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user) {
      console.error("User authentication error:", userError);
      throw new Error("User not authenticated");
    }

    const user = userData.user;
    console.log("User authenticated successfully");

    // Get Stripe secret key from poupeja_settings
    console.log("Fetching Stripe configuration from poupeja_settings...");
    const { data: settings, error: settingsError } = await supabaseClient
      .from("poupeja_settings")
      .select("value")
      .eq("key", "stripe_secret_key")
      .maybeSingle();

    if (settingsError) {
      console.error("Settings query error:", settingsError);
      throw new Error("Failed to load payment configuration");
    }

    if (!settings?.value) {
      console.error("STRIPE_SECRET_KEY not found in settings");
      throw new Error("Payment system not configured. Please contact support.");
    }

    // Decode the Stripe key if it's base64 encoded
    let stripeKey = settings.value;
    try {
      // Check if the key is already in the correct format (starts with sk_)
      if (!stripeKey.startsWith('sk_')) {
        stripeKey = atob(stripeKey);
      }
    } catch (decodeError) {
      console.error("Failed to decode Stripe key");
      throw new Error("Invalid payment configuration. Please contact support.");
    }
    
    console.log("Stripe configuration loaded successfully");

    // Query subscription with status check
    const { data: subscription, error: subError } = await supabaseClient
      .from("poupeja_subscriptions")
      .select("stripe_customer_id, status, plan_type")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    if (subError) {
      console.error("Subscription query error:", subError);
      throw new Error(`Database error: ${subError.message}`);
    }

    if (!subscription?.stripe_customer_id) {
      console.log("No active subscription found for user");
      throw new Error("No active subscription found. Please subscribe to a plan to manage your subscription.");
    }

    console.log("Found active subscription:", { 
      status: subscription.status,
      planType: subscription.plan_type
    });

    console.log("Initializing Stripe...");
    const stripe = new (await import("https://esm.sh/stripe@13.6.0")).Stripe(
      stripeKey,
      {
        apiVersion: "2023-10-16",
      }
    );

    // Create billing portal session
    console.log("Creating billing portal session for customer");
    const origin = req.headers.get("origin") || "https://poupeja-demonstracao.vercel.app";
    console.log("Using return URL:", `${origin}/plans`);

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${origin}/plans`,
    });

    console.log("Billing portal session created successfully");

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in customer-portal function:", errorMessage);
    console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
