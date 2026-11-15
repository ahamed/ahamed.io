import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fixed CSS-module class names, the same in the build and in scripts/prerender.mjs, so the
  // prerendered Text-mode markup matches the built stylesheet.
  css: { modules: { generateScopedName: '_[local]_[hash:base64:5]' } },
});
