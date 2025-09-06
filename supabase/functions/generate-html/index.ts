import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"
import { corsHeaders } from "../_shared/cors.ts"

// Função para corrigir caracteres UTF-8 corrompidos
function fixUTF8(text: string): string {
  if (!text) return text
  return text
    .replace(/Ã¡/g, 'á')
    .replace(/Ã§/g, 'ç')
    .replace(/Ã£/g, 'ã')
    .replace(/Ã©/g, 'é')
    .replace(/Ã­/g, 'í')
    .replace(/Ã³/g, 'ó')
    .replace(/Ãº/g, 'ú')
    .replace(/Ã /g, 'à')
    .replace(/Ãª/g, 'ê')
    .replace(/Ã´/g, 'ô')
    .replace(/Ã¢/g, 'â')
    .replace(/JÃ¡/g, 'Já')
    .replace(/jÃ¡/g, 'já')
    .replace(/AÃ§/g, 'Aç')
    .replace(/aÃ§/g, 'aç')
}

// Template do index.html completo
function generateHtmlTemplate(companyName: string, companyDescription: string, companyLogo: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>${companyName}</title>
    <meta name="description" content="${companyDescription}" />
    <meta name="author" content="Lovable" />

    <!-- Favicon -->
    <link rel="icon" href="${companyLogo}" type="image/png" />

    <!-- PWA Meta Tags -->
    <meta name="theme-color" content="#4ECDC4" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="${companyName}" />
    <link rel="apple-touch-icon" href="${companyLogo}" />
    <!-- PWA Manifest -->
    <link rel="manifest" href="/manifest.json" />

    <!-- Open Graph / WhatsApp Meta Tags -->
    <meta property="og:title" content="${companyName}" />
    <meta property="og:description" content="${companyDescription}" />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="${companyLogo}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <!-- Twitter Meta Tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${companyName}" />
    <meta name="twitter:description" content="${companyDescription}" />
    <meta name="twitter:image" content="${companyLogo}" />

    <!-- Vite -->
    <link rel="modulepreload" href="/src/main.tsx" />

    <script>
      // Pre-carregar branding cache se existir
      (function() {
        const cached = localStorage.getItem('app_branding_cache');
        if (cached) {
          try {
            const branding = JSON.parse(cached);
            const isExpired = Date.now() - branding.timestamp > 300000; // 5 min
            
            if (!isExpired && branding.logoUrl) {
              // Pre-carregar imagem
              const link = document.createElement('link');
              link.rel = 'preload';
              link.as = 'image';
              link.href = branding.logoUrl;
              document.head.appendChild(link);
              
              // Atualizar título
              if (branding.companyName) {
                document.title = branding.companyName + ' - Controle Financeiro';
              }
              
              // Atualizar favicon
              if (branding.faviconUrl && branding.faviconUrl !== '/favicon.ico') {
                const favicon = document.querySelector("link[rel*='icon']");
                if (favicon) {
                  favicon.href = branding.faviconUrl;
                }
              }
            }
          } catch (e) {
            // Ignore
          }
        }
      })();
    </script>
  </head>
  <body>
    <div id="root"></div>
    <!-- IMPORTANT: DO NOT REMOVE THIS SCRIPT TAG OR THIS VERY COMMENT! -->
    <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log(`[GENERATE-HTML] v1.3 SERVICE-ROLE-KEY - ${new Date().toISOString()}`)

  try {
    // Usar SERVICE_ROLE_KEY para acessar configurações diretamente (como get-public-settings faz)
    console.log('[GENERATE-HTML] Buscando configurações com SERVICE_ROLE_KEY...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    )

    // Buscar apenas dados de branding (seguindo mesma lógica do get-public-settings)
    const { data: settings, error: settingsError } = await supabase
      .from('poupeja_settings')
      .select('key, value')
      .eq('category', 'branding')
      .in('key', ['company_name', 'company_description', 'logo_url'])
      .eq('encrypted', false)

    if (settingsError) {
      console.error('[GENERATE-HTML] Erro ao buscar configurações:', settingsError)
      throw new Error(`Erro ao buscar configurações: ${settingsError.message}`)
    }

    console.log('[GENERATE-HTML] Configurações encontradas:', settings)

    const config: Record<string, string> = {}
    if (settings) {
      for (const setting of settings) {
        config[setting.key] = setting.value
      }
    }

    console.log('[GENERATE-HTML] Config processado:', config)

    // Aplicar correção UTF-8
    const companyName = fixUTF8(config.company_name || 'Poupei Já')
    const companyDescription = fixUTF8(config.company_description || 'Seu assistente financeiro pessoal')
    const companyLogo = config.logo_url || '/placeholder.svg'

    console.log('[GENERATE-HTML] Valores finais:', { companyName, companyDescription, companyLogo })

    console.log(`[GENERATE-HTML] Gerando HTML para: ${companyName}`)
    console.log(`[GENERATE-HTML] Parâmetros do template:`, { 
      param1: companyName, 
      param2: companyDescription, 
      param3: companyLogo 
    })

    // Gerar HTML
    const htmlContent = generateHtmlTemplate(companyName, companyDescription, companyLogo)
    
    // Log do HTML gerado (primeiras 500 caracteres)
    console.log('[GENERATE-HTML] HTML gerado (início):', htmlContent.substring(0, 500))

    return new Response(JSON.stringify({
      success: true,
      data: {
        company_name: companyName,
        company_description: companyDescription,
        company_logo: companyLogo,
        html_content: htmlContent,
        instructions: {
          step1: "Copie o HTML gerado abaixo",
          step2: "Substitua o conteúdo do arquivo index.html no seu repositório GitHub",
          step3: "Faça commit das mudanças",
          step4: "O deploy automático será executado na Vercel/Easypanel"
        }
      },
      timestamp: new Date().toISOString()
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=UTF-8"
      }
    })

  } catch (error) {
    console.error("[GENERATE-HTML] Error:", error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json; charset=UTF-8"
      }
    })
  }
}) 