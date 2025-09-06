import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { CryptoProvider } from "./types.ts";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, stripe-signature",
  "Access-Control-Max-Age": "86400"
};

export const cryptoProvider: CryptoProvider = {
  computeHMACSignatureAsync: (payload, secret) => {
    const key = new TextEncoder().encode(secret);
    return crypto.subtle.importKey(
      "raw",
      key,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    ).then((cryptoKey) =>
      crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(payload))
    ).then((signature) =>
      Array.from(new Uint8Array(signature), (byte) =>
        byte.toString(16).padStart(2, '0')
      ).join('')
    );
  }
};

export async function verifyStripeSignature(
  body: string, 
  signature: string | null,
  stripe: any
): Promise<boolean> {
  if (!signature) return false;
  
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (!webhookSecret) return false;
  
  try {
    await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider
    );
    return true;
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return false;
  }
}

export function createSupabaseClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
}

export function createSuccessResponse(event: any) {
  return new Response(JSON.stringify({
    received: true,
    event: event.type
  }), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    },
    status: 200
  });
}

export function createErrorResponse(error: any, status: number = 500) {
  return new Response(JSON.stringify({
    error: status === 500 ? "Internal server error" : "Bad request",
    message: error.message
  }), {
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders
    },
    status
  });
}