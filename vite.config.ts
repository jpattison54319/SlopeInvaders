import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the production build works when opened from a file path
  // or hosted from a subdirectory.
  base: './',
  plugins: [react()],
  // Honor a PORT env var (e.g. when a preview/launch tool assigns one) and bind
  // to it strictly; otherwise fall back to Vite's default port selection.
  server: process.env.PORT
    ? { port: Number(process.env.PORT), strictPort: true }
    : undefined,
})
