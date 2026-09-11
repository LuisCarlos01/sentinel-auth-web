import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // sentinel-auth-api não expõe CORS (gap documentado em
    // docs/integrations/sentinel-auth-api-web.md) — em dev local, proxyamos
    // pra tornar a chamada same-origin em vez de depender de CORS. Não
    // resolve produção (origens diferentes de verdade lá); ver .env.production.
    proxy: {
      '/api/v1': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
