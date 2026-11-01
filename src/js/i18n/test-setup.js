// Підготовка для всіх тестів (vitest.config.js → setupFiles), лежить в i18n/, бо стосується мови. Не імпортувати в робочий код.
import { vi } from 'vitest';

// Мова тестів — українська (еталонний словник), незалежно від мови системи, у якій їх запускають.
// i18n читає мову під час імпорту: localStorage['lego-locale'] → navigator.language.
vi.stubGlobal('navigator', { ...globalThis.navigator, language: 'uk-UA' });
