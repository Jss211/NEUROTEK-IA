import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Permite que funcione con 127.0.0.1
    proxy: {
      '/api-supabase': {
        target: 'https://ordywmtwdovinbtaawge.supabase.co',
        changeOrigin: true,
        secure: false, // Ignora el error de la fecha de tu PC
        rewrite: (path) => path.replace(/^\/api-supabase/, '')
      }
    }
  }
})
