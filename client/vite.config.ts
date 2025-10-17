import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from 'tailwindcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5228',
      '/ws': { target: 'ws://localhost:5228', ws: true }
    }
  },
  css: { postcss: { plugins: [tailwindcss(), autoprefixer()] } }
})
