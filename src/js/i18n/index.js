import uk from './locales/uk.js';

// Нова мова = файл у locales/ + рядок тут. uk — еталон і fallback.
const DICTIONARIES = { uk };
export const DEFAULT_LOCALE = 'uk';
export const LOCALES = Object.keys(DICTIONARIES);
const STORAGE_KEY = 'lego-locale';

let locale = detectLocale();

/** @returns {string} */
function detectLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && DICTIONARIES[saved]) return saved;
  } catch {
    // localStorage недоступний (приватний режим тощо) — працюємо без нього
  }
  const nav = (navigator.language || '').slice(0, 2).toLowerCase();
  return DICTIONARIES[nav] ? nav : DEFAULT_LOCALE;
}

const lookup = (dict, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict);

// Параметр може бути вкладеним повідомленням {key, params}.
const param = v => (v && typeof v === 'object' && v.key ? t(v.key, v.params) : v);

// t('section.name', {n: 2}) → 'Секція 2'. Відсутній ключ → fallback на uk, далі сам ключ.
export function t(key, params) {
  let str = lookup(DICTIONARIES[locale], key);
  if (typeof str !== 'string') str = lookup(DICTIONARIES[DEFAULT_LOCALE], key);
  if (typeof str !== 'string') return key;
  return params ? str.replace(/\{(\w+)\}/g, (m, p) => (p in params ? param(params[p]) : m)) : str;
}

// Повідомлення з core/ мають вигляд {key, params}.
export const tm = msg => t(msg.key, msg.params);

// Число за правилами поточної мови: formatNumber(10.3, 2) → '10,30'
export const formatNumber = (n, digits = 0) =>
  new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);

export const getLocale = () => locale;

export function setLocale(next) {
  if (!DICTIONARIES[next]) return;
  locale = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // localStorage недоступний (приватний режим тощо) — працюємо без нього
  }
}

// Перекладає статичну розмітку:
// data-i18n="key" → textContent, data-i18n-title / data-i18n-placeholder / data-i18n-aria-label → атрибут.
const ATTRS = ['title', 'placeholder', 'aria-label'];

export function translateDom(root = document) {
  document.documentElement.lang = locale;
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
  ATTRS.forEach(attr => {
    root
      .querySelectorAll(`[data-i18n-${attr}]`)
      .forEach(el => el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`))));
  });
}
