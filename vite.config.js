import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      "/api/phivolcs": {
        target: "https://earthquake.phivolcs.dost.gov.ph",
        changeOrigin: true,
        secure: false,
        rewrite: () => "/",
      },
    },
  }
})
