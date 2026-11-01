import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import { readdirSync } from 'node:fs';

// Шари src/js (див. CLAUDE.md): імпортувати можна лише «вниз».
// Для одного файлу діє лише останнє правило no-restricted-imports, тож обмеження шару
// для вкладених папок (core/types/<тип>/…) складаємо разом.
const restrict = (files, ...groups) => ({
  files,
  rules: { 'no-restricted-imports': ['error', { patterns: groups.filter(g => g.group.length) }] },
});

const THREE = ['three', 'three/*'];
const CORE = {
  group: ['**/ui/**', '**/viewer/**', ...THREE],
  message: 'core/ — чиста логіка: без DOM, ui/ і Three.js.',
};
const UI = {
  group: ['**/viewer/**', ...THREE],
  message: "ui/ не працює з Three.js напряму — лише через API в'юера з main.js.",
};

// Типи меблів незалежні один від одного: core/types/<a>/ і ui/types/<a>/ не імпортують інших типів
const TYPE_IDS = readdirSync(new URL('./src/js/core/types', import.meta.url), { withFileTypes: true })
  .filter(d => d.isDirectory())
  .map(d => d.name);
const otherTypes = id => ({
  group: TYPE_IDS.filter(o => o !== id).flatMap(o => [`../${o}/**`, `**/types/${o}/**`]),
  message: 'Типи меблів не залежать один від одного: спільне — у core/common/.',
});
const typeRules = TYPE_IDS.flatMap(id => [
  restrict([`src/js/core/types/${id}/**`], CORE, otherTypes(id)),
  restrict([`src/js/ui/types/${id}/**`], UI, otherTypes(id)),
]);

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
  restrict(['src/js/config/**', 'src/js/utils/**'], {
    group: ['**/core/**', '**/ui/**', '**/viewer/**', '**/i18n/**', ...THREE],
    message: 'config/ і utils/ — нижній шар, вони нічого не імпортують з core/i18n/ui/viewer.',
  }),
  restrict(['src/js/core/**', 'src/js/i18n/**'], CORE),
  restrict(['src/js/core/common/**'], CORE, {
    group: ['**/types/**', '**/registry.js'],
    message: 'core/common/ — спільні блоки для типів, самі типів не знають.',
  }),
  restrict(['src/js/ui/**'], UI),
  restrict(['src/js/viewer/**'], { group: ['**/ui/**'], message: 'viewer/ не залежить від ui/.' }),
  ...typeRules,
  {
    files: ['*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
  },
  // e2e: код тесту — у Node, колбеки page.evaluate — у браузері
  {
    files: ['e2e/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: { ...globals.node, ...globals.browser },
    },
  },
  prettier,
];
