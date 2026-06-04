import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative base so the production build works when opened from a file path
  // or hosted from a subdirectory.
  base: './',
  plugins: [react()],
})
