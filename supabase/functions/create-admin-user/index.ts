import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verificar se o usuário admin já existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
    const adminExists = existingUser?.users?.some(user => user.email === 'admin@admin.com')

    if (adminExists) {
      console.log('Usuário admin já existe')
      return new Response(
        JSON.stringify({ message: 'Admin user already exists' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    // Criar usuário admin
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@admin.com',
      password: Deno.env.get('DEFAULT_PASSWORD') || 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Administrator'
      }
    })

    if (createUserError) {
      throw createUserError
    }

    console.log('Usuário admin criado com sucesso')

    // Adicionar role de admin na tabela user_roles
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        role: 'admin'
      })

    if (roleError) {
      console.error('Erro ao adicionar role admin:', roleError)
      throw roleError
    }

    console.log('Role admin adicionada com sucesso')

    return new Response(
      JSON.stringify({
        message: 'Admin user created successfully',
        user_id: newUser.user.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Erro ao criar usuário admin:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})