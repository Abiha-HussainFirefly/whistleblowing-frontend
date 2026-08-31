import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import security from 'eslint-plugin-security';
import reactRefresh from 'eslint-plugin-react-refresh';

/**
 * Lint configuration for the Tellara client.
 *
 * Accessibility rules are errors, not warnings. This is a reporting channel that
 * people use under stress, sometimes on a borrowed device, sometimes with a
 * screen reader — an unlabelled control or a click handler with no keyboard
 * equivalent is a functional defect here, not a style preference.
 *
 * Formatting is not enforced; it costs review attention better spent on the
 * correctness and accessibility rules below.
 */
export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.config.*', 'src/assets/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      // Registered so the existing `security/*` disable comments resolve; the
      // rules themselves are off, since every report was a typed enum lookup.
      security,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly', document: 'readonly', navigator: 'readonly',
        localStorage: 'readonly', sessionStorage: 'readonly', console: 'readonly',
        fetch: 'readonly', FormData: 'readonly', Blob: 'readonly', URL: 'readonly',
        setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly',
        clearInterval: 'readonly', HTMLElement: 'readonly', HTMLInputElement: 'readonly',
        HTMLFormElement: 'readonly', HTMLTextAreaElement: 'readonly',
        HTMLButtonElement: 'readonly', HTMLDivElement: 'readonly',
        HTMLHeadingElement: 'readonly', HTMLSelectElement: 'readonly',
        MouseEvent: 'readonly', KeyboardEvent: 'readonly', Event: 'readonly',
        AbortController: 'readonly', crypto: 'readonly', alert: 'readonly',
        MutationObserver: 'readonly', ResizeObserver: 'readonly', requestAnimationFrame: 'readonly',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      /* ------------------------- accessibility ------------------------- */
      // Every interactive control must be reachable and identifiable without a mouse.
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'error',
      'jsx-a11y/no-static-element-interactions': 'error',
      'jsx-a11y/label-has-associated-control': [
        'error',
        { assert: 'either', depth: 4 },
      ],
      // Announcing every keystroke is worse than announcing nothing, so live
      // regions have to be deliberate.
      // `ignoreNonDOM` because the rule otherwise fires on custom components that
      // happen to take a prop called `role` (e.g. <RoleBadge role="ADMIN" />),
      // which has nothing to do with ARIA.
      'jsx-a11y/aria-role': ['error', { ignoreNonDOM: true }],

      /* --------------------------- correctness -------------------------- */
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Report content must never reach the browser console.
      'no-console': ['error', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Noisy on typed enum and record lookups, which is all this codebase does.
      'security/detect-object-injection': 'off',
      'react-refresh/only-export-components': 'off',

      /* --------------------------- pragmatics --------------------------- */
      // Pre-existing debt from the port; visible but not blocking.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'src/test-setup.ts'],
    languageOptions: {
      globals: { vi: 'readonly', describe: 'readonly', it: 'readonly', expect: 'readonly', beforeEach: 'readonly', afterEach: 'readonly', beforeAll: 'readonly', afterAll: 'readonly' },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off',
    },
  },
);
