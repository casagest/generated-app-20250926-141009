import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // This simplified configuration allows the plugin to correctly infer its settings
    // from wrangler.jsonc, which is the most stable approach for monorepos.
    cloudflare(),
  ],
  resolve: {
    // This alias block is critical for fixing all module resolution errors
    // in the frontend application by mapping path aliases to the correct directories.
    alias: {
      '@': path.resolve(__dirname, './apps/web-admin/src'),
      '@shared': path.resolve(__dirname, './packages/shared/src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      }
    }
  },
})