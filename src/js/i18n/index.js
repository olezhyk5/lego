import uk from './locales/uk.js';
import en from './locales/en.js';

// Нова мова = файл у locales/ + рядок тут. uk — еталон і fallback.
// Мова спільна для всіх екземплярів конфігуратора на сторінці.
/** @type {Record<string, Record<string, any>>} */
const DICTIONARIES = { uk, en };
export const DEFAULT_LOCALE = 'uk';
// Доступні мови; addMessages з новою мовою додає її сюди
export const LOCALES = Object.keys(DICTIONARIES);

let locale = pickLocale();

/**
 * Мова для старту: збережена (якщо відома) → мова браузера → uk.
 * @param {string | null} [saved]
 * @returns {string}
 */
export function pickLocale(saved = null) {
  if (saved && DICTIONARIES[saved]) return saved;
  const nav = (globalThis.navigator?.language || '').slice(0, 2).toLowerCase();
  return DICTIONARIES[nav] ? nav : DEFAULT_LOCALE;
}

const isPlainObject = v => !!v && typeof v === 'object' && !Array.isArray(v);
// Нові об'єкти замість зміни словників: еталонні uk/en лишаються такими, як у файлах
const merge = (base, extra) =>
  Object.fromEntries(
    [...new Set([...Object.keys(base), ...Object.keys(extra)])].map(k => [
      k,
      isPlainObject(base[k]) && isPlainObject(extra[k]) ? merge(base[k], extra[k]) : (extra[k] ?? base[k]),
    ]),
  );

/**
 * Власні тексти: { <мова>: { <namespace>: { <ключ>: 'текст' } } }. Доповнюють або перекривають словник;
 * нова мова з'являється в LOCALES (відсутні в ній ключі беруться з uk).
 * @param {Record<string, Record<string, any>>} messages
 */
export function addMessages(messages) {
  Object.entries(messages).forEach(([code, dict]) => {
    if (!DICTIONARIES[code]) LOCALES.push(code);
    DICTIONARIES[code] = merge(DICTIONARIES[code] || {}, dict);
  });
}

const lookup = (dict, key) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), dict);

// Параметр може бути вкладеним повідомленням {key, params}.
const param = v => (v && typeof v === 'object' && v.key ? t(v.key, v.params) : v);

// t('section.name', {n: 2}) → 'Секція 2'. Відсутній ключ → fallback на uk, далі сам ключ.
/**
 * @param {string} key
 * @param {Record<string, any>} [params]
 * @returns {string}
 */
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

/**
 * Змінює мову (невідома — ігнорується). Зберігає вибір той, хто викликає (сховище екземпляра).
 * @param {string} next
 * @returns {boolean} мову змінено
 */
export function setLocale(next) {
  if (!DICTIONARIES[next] || next === locale) return false;
  locale = next;
  return true;
}

// Перекладає статичну розмітку:
// data-i18n="key" → textContent, data-i18n-title / data-i18n-placeholder / data-i18n-aria-label → атрибут.
const ATTRS = ['title', 'placeholder', 'aria-label'];

// lang ставиться на root (для document — на <html>).
/** @param {Document | HTMLElement} [root] */
export function translateDom(root = document) {
  ('documentElement' in root ? root.documentElement : root).lang = locale;
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n') || '');
  });
  ATTRS.forEach(attr => {
    root
      .querySelectorAll(`[data-i18n-${attr}]`)
      .forEach(el => el.setAttribute(attr, t(el.getAttribute(`data-i18n-${attr}`) || '')));
  });
}
