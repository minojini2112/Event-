import js from '@eslint/js';
import nextPlugin from '@next/eslint-plugin-next';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}'],
    plugins: {
      '@next/next': nextPlugin,
    },
    rules: {
      '@next/next/no-img-element': 'off', // Disable img element warning
      'react/no-unescaped-entities': 'error', // Keep this as error
      '@typescript-eslint/no-unused-vars': 'warn', // Keep as warning
      'react-hooks/exhaustive-deps': 'warn', // Keep as warning
    },
  },
];
