import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** The 3D libraries: only the lazy Voyage chunk imports them, and they change less often. */
const VENDOR_3D =
  /[\\/]node_modules[\\/](?:\.pnpm[\\/][^\\/]+[\\/]node_modules[\\/])?(?:three|three-stdlib|postprocessing|@react-three[\\/][^\\/]+|troika-[^\\/]+|maath|camera-controls|three-mesh-bvh|meshline|stats-gl|@monogrid[\\/]gainmap-js)[\\/]/;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Fixed CSS-module class names, the same in the build and in scripts/prerender.mjs, so the
  // prerendered Text-mode markup matches the built stylesheet.
  css: { modules: { generateScopedName: '_[local]_[hash:base64:5]' } },
  build: {
    // vendor-3d (three.js and friends) is ~1 MB on its own; `pnpm size` budgets every chunk.
    chunkSizeWarningLimit: 1100,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            // Only the matched modules: React and zustand stay with the app entry.
            { name: 'vendor-3d', test: VENDOR_3D, includeDependenciesRecursively: false },
          ],
        },
      },
    },
  },
});
