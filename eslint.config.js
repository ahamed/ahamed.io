// @ts-check
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    'dist',
    'coverage',
    'playwright-report',
    'test-results',
    'blob-report',
    'openspec',
    '.claude',
    // Vendored Basis Universal transcoder, copied from three.
    'public/basis',
  ]),
  {
    files: ['**/*.{ts,tsx,js,mjs}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // Frame callbacks run 60+ times a second: an allocation there is garbage every frame.
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='useFrame'] NewExpression",
          message:
            'No `new` inside a useFrame callback: create scratch objects once (module scope or a ref) and reuse them.',
        },
      ],
    },
  },
  {
    files: ['*.{ts,js,mjs}', 'e2e/**/*.ts', 'scripts/**/*.mjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  prettier,
]);
