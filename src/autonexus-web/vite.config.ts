import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  server: {
    port: 3000,
    allowedHosts: [
      'ademartognasca.com.br',
      'www.ademartognasca.com.br',
      '.ademartognasca.com.br'
    ],
    hmr: {
      clientPort: 443 // Hot reload seguro através do túnel Cloudflare
    },
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000', // 127.0.0.1 resolve o 502
        changeOrigin: true,
        secure: false,
        timeout: 120_000,
        proxyTimeout: 120_000
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        timeout: 120_000,
        proxyTimeout: 120_000
      }
    }
  }
})