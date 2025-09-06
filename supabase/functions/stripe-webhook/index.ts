import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { 
  corsHeaders, 
  cryptoProvider, 
  verifyStripeSignature, 
  createSupabaseClient,
  createSuccessResponse,
  createErrorResponse
} from "./utils.ts";

import { handleCheckoutSessionCompleted } from "./handlers/checkout-session-completed.ts";
import { handleSubscriptionUpdated } from "./handlers/subscription-updated.ts";
import { handleSubscriptionDeleted } from "./handlers/subscription-deleted.ts";
import { handleInvoicePaymentSucceeded } from "./handlers/invoice-payment-succeeded.ts";
import { handleInvoicePaymentFailed } from "./handlers/invoice-payment-failed.ts";

// Stripe instance will be created after getting the secret key from settings

const handleRequest = async (req: Request) => {
  // Handle OPTIONS requests (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }
  
  // Get request body once and store it
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  
  console.log("Processing Stripe webhook...", {
    hasSignature: !!signature,
    bodyLength: body.length,
    method: req.method
  });
  
  // For Stripe webhooks, main verification is via signature, not auth header
  if (!signature) {
    console.error("Missing Stripe signature");
    return new Response("Missing Stripe signature", { status: 400 });
  }

  // Get Stripe credentials from Supabase settings
  const supabase = createSupabaseClient();
  
  const { data: stripeSecretData } = await supabase
    .from('poupeja_settings')
    .select('value')
    .eq('key', 'stripe_secret_key')
    .single();

  const { data: webhookSecretData } = await supabase
    .from('poupeja_settings')
    .select('value')
    .eq('key', 'stripe_webhook_secret')
    .single();

  if (!stripeSecretData?.value || !webhookSecretData?.value) {
    console.error("Missing Stripe configuration");
    return new Response("Stripe configuration not found", { status: 500 });
  }

  // Decode keys if they are base64 encoded
  const stripeSecretKey = stripeSecretData.value.includes('sk_') ? 
    stripeSecretData.value : 
    atob(stripeSecretData.value);

  const webhookSecret = webhookSecretData.value.includes('whsec_') ? 
    webhookSecretData.value : 
    atob(webhookSecretData.value);

  // Create Stripe instance with the secret key
  const stripe = new (await import("https://esm.sh/stripe@13.6.0")).Stripe(
    stripeSecretKey,
    { apiVersion: "2023-10-16" }
  );
  
  // Verify Stripe signature
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
    console.log("Valid Stripe signature verified, proceeding with processing");
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return new Response(`Webhook Error: ${err.message}`, {
      status: 400
    });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event, stripe, supabase);
        break;
        
      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event, stripe, supabase);
        break;
        
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event, stripe, supabase);
        break;
        
      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event, stripe, supabase);
        break;
        
      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event, stripe, supabase);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return createSuccessResponse(event);
  } catch (error) {
    console.error("Error processing webhook:", error.message, error.stack);
    return createErrorResponse(error);
  }
};

serve(handleRequest);