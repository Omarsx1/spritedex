import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Vercel expone VERCEL_ENV ('production' | 'preview' | 'development') en el build.
  // Se inyecta como constante para que la app pueda saltarse la sesion anonima y la
  // telemetria en previews, sin depender del hostname.
  define: {
    __VERCEL_ENV__: JSON.stringify(process.env.VERCEL_ENV || '')
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('canvas-confetti') || id.includes('sweetalert2') || id.includes('gsap')) {
              return 'vendor-ui';
            }
          }
        }
      }
    }
  }
})
