import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

// Шари src/js (див. CLAUDE.md): імпортувати можна лише «вниз».
const layer = (files, patterns, message) => ({
  files,
  rules: {
    'no-restricted-imports': ['error', { patterns: [{ group: patterns, message }] }],
  },
});

export default [
  { ignores: ['node_modules/', 'assets/'] },
  js.configs.recommended,
  {
    files: ['src/js/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.browser },
    rules: {
      eqeqeq: ['error', 'smart'],
      'no-var': 'error',
      'prefer-const': 'error',
      'no-unused-vars': ['error', { args: 'after-used', caughtErrors: 'none' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  layer(
    ['src/js/config/**', 'src/js/utils/**'],
    ['../core/*', '../ui/*', '../viewer/*', 'three', 'three/*'],
    'config/ і utils/ — нижній шар, вони нічого не імпортують з core/ui/viewer.',
  ),
  layer(
    ['src/js/core/**', 'src/js/i18n/**'],
    ['../ui/*', '../viewer/*', 'three', 'three/*'],
    'core/ — чиста логіка: без DOM, ui/ і Three.js.',
  ),
  layer(
    ['src/js/ui/**'],
    ['../viewer/*', 'three', 'three/*'],
    "ui/ не працює з Three.js напряму — лише через API в'юера з main.js.",
  ),
  layer(['src/js/viewer/**'], ['../ui/*'], 'viewer/ не залежить від ui/.'),
  {
    files: ['*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
  },
  prettier,
];
