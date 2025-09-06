import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    // Create service role client (bypasses RLS)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey)
    
    // Create user client to verify authentication
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader },
      },
    })

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      throw new Error('User not authenticated')
    }

    // Use the new check_user_role function to verify admin access
    const { data: isAdmin, error: roleError } = await supabaseService
      .rpc('check_user_role', {
        user_id: user.id,
        target_role: 'admin'
      })

    if (roleError) {
      console.error('Error checking user role:', roleError)
      throw roleError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        isAdmin: Boolean(isAdmin),
        userId: user.id,
        userEmail: user.email
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error in verify-admin-access function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        isAdmin: false
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})