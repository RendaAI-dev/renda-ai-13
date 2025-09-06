import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
}

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

// Template do manifest.json personalizado
function generateManifestTemplate(companyName: string, companyDescription: string, logoUrl: string, themeColor: string, backgroundColor: string): string {
  return JSON.stringify({
    name: companyName,
    short_name: companyName.length > 12 ? companyName.substring(0, 12) : companyName,
    description: companyDescription,
    start_url: "/",
    display: "standalone",
    background_color: backgroundColor,
    theme_color: themeColor,
    orientation: "portrait",
    scope: "/",
    icons: [
      {
        src: logoUrl,
        sizes: "192x192",
        type: "image/png",
        purpose: "any maskable"
      },
      {
        src: logoUrl,
        sizes: "512x512",
        type: "image/png",
        purpose: "any maskable"
      }
    ]
  }, null, 2)
}

// Template do service worker personalizado
function generateServiceWorkerTemplate(companyName: string): string {
  return `// Service Worker para ${companyName}
// Gerado automaticamente pelo sistema de branding

const CACHE_NAME = '${companyName.toLowerCase().replace(/\s+/g, '-')}-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/App.css',
  '/src/index.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});`
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log(`[GENERATE-PWA-MANIFEST] v1.0 SERVICE-ROLE-KEY - ${new Date().toISOString()}`)

  try {
    // Usar SERVICE_ROLE_KEY para acessar configurações diretamente
    console.log('[GENERATE-PWA-MANIFEST] Buscando configurações com SERVICE_ROLE_KEY...')
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '',
      { auth: { persistSession: false } }
    )

    // Buscar dados de branding
    const { data: settings, error: settingsError } = await supabase
      .from('poupeja_settings')
      .select('key, value')
      .eq('category', 'branding')
      .in('key', ['company_name', 'company_description', 'logo_url', 'theme_color', 'background_color'])
      .eq('encrypted', false)

    if (settingsError) {
      console.error('[GENERATE-PWA-MANIFEST] Erro ao buscar configurações:', settingsError)
      throw new Error(`Erro ao buscar configurações: ${settingsError.message}`)
    }

    console.log('[GENERATE-PWA-MANIFEST] Configurações encontradas:', settings)

    const config: Record<string, string> = {}
    if (settings) {
      for (const setting of settings) {
        config[setting.key] = setting.value
      }
    }

    console.log('[GENERATE-PWA-MANIFEST] Config processado:', config)

    // Aplicar correção UTF-8 e valores padrão
    const companyName = fixUTF8(config.company_name || 'Poupei Já')
    const companyDescription = fixUTF8(config.company_description || 'Seu assistente financeiro pessoal')
    const logoUrl = config.logo_url || '/placeholder.svg'
    const themeColor = config.theme_color || '#4ECDC4'
    const backgroundColor = config.background_color || '#FFFFFF'

    console.log('[GENERATE-PWA-MANIFEST] Valores finais:', { 
      companyName, 
      companyDescription, 
      logoUrl, 
      themeColor, 
      backgroundColor 
    })

    // Gerar arquivos PWA
    const manifestContent = generateManifestTemplate(companyName, companyDescription, logoUrl, themeColor, backgroundColor)
    const serviceWorkerContent = generateServiceWorkerTemplate(companyName)
    
    console.log('[GENERATE-PWA-MANIFEST] Arquivos gerados com sucesso')

    return new Response(JSON.stringify({
      success: true,
      data: {
        company_name: companyName,
        company_description: companyDescription,
        logo_url: logoUrl,
        theme_color: themeColor,
        background_color: backgroundColor,
        files: {
          manifest: {
            filename: 'manifest.json',
            content: manifestContent,
            path: '/public/manifest.json'
          },
          service_worker: {
            filename: 'sw.js',
            content: serviceWorkerContent,
            path: '/public/sw.js'
          }
        },
        instructions: {
          step1: "Copie o conteúdo do manifest.json abaixo",
          step2: "Crie/atualize o arquivo public/manifest.json no seu repositório",
          step3: "Copie o conteúdo do service worker abaixo",
          step4: "Crie/atualize o arquivo public/sw.js no seu repositório",
          step5: "Faça commit das mudanças",
          step6: "O deploy automático será executado na Vercel/Easypanel"
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
    console.error("[GENERATE-PWA-MANIFEST] Error:", error)
    
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