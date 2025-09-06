
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    // Create a Supabase client with the Auth context of the logged in user
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",  // Alterado de API_URL
      Deno.env.get("SUPABASE_ANON_KEY") ?? "", // Alterado de ANON_KEY
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { goal_id, amount_change } = await req.json();

    if (!goal_id || amount_change === undefined) {
      throw new Error("Missing required parameters: goal_id and amount_change");
    }

    const { data, error } = await supabaseClient.rpc("update_goal_amount", {
      p_goal_id: goal_id,
      p_amount_change: amount_change,
    });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify({ success: true, new_amount: data }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 400,
    });
  }
});
