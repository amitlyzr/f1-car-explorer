import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const allowedHosts = ['.alpha.site', '.run.app', 'localhost']

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', allowedHosts },
  preview: { host: '0.0.0.0', allowedHosts },
  build: { chunkSizeWarningLimit: 1600 },
})
