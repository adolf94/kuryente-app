import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import mkcert from 'vite-plugin-mkcert';
import { tanstackRouter } from '@tanstack/router-plugin/vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    https: true, // Enable HTTPS for the development server
    headers: {
       'Cross-Origin-Embedder-Policy': 'unsafe-none'
    },
  },build: {
    sourcemap: true
  },
  plugins: [
    mkcert(),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react()
    // other plugins
  ]
})
