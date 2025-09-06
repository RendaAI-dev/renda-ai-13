
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'PoupeJá',
        short_name: 'PoupeJá',
        description: 'Gerencie suas finanças com PoupeJá',
        theme_color: '#005C6E',
        background_color: '#ffffff',
        icons: [
          {
            src: '/lovable-uploads/feb4b0d7-9e89-45bc-bae1-72b1af54eacd.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/lovable-uploads/feb4b0d7-9e89-45bc-bae1-72b1af54eacd.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/lovable-uploads/feb4b0d7-9e89-45bc-bae1-72b1af54eacd.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        categories: ['finance', 'productivity']
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,ttf,woff,woff2}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB limit
        runtimeCaching: [
          {
            urlPattern: ({url}) => url.pathname.startsWith('/api'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              }
            }
          }
        ],
        // Adicionar esta configuração para lidar com todas as rotas de navegação
        navigateFallback: 'index.html',
        // Opcionalmente, você pode excluir algumas rotas da navegação fallback
        // navigateFallbackDenylist: [/^\/api\//]
      },
      devOptions: {
        enabled: true,
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
