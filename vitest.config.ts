import { defineConfig } from 'vitest/config'

// Test config is kept separate from vite.config.ts so the (pure-TypeScript)
// math/game-logic tests don't pull in the React plugin — that avoids a type
// clash between Vite 8 and the Vite bundled inside Vitest.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
