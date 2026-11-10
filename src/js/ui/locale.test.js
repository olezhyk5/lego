// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupDom, ref } from './test-dom.js';
import { t, setLocale, getLocale, translateDom, pickLocale, addMessages, LOCALES } from '../i18n/index.js';

let root;
beforeEach(() => (root = setupDom()));
afterEach(() => setLocale('uk'));

describe('мова інтерфейсу', () => {
  it('є українська й англійська', () => expect(LOCALES).toEqual(expect.arrayContaining(['uk', 'en'])));

  it('setLocale змінює t(), але нічого не зберігає (це робить сховище екземпляра); невідома мова ігнорується', () => {
    expect(setLocale('en')).toBe(true);
    expect(getLocale()).toBe('en');
    expect(t('section.name', { n: 2 })).toBe('Section 2');
    expect(localStorage.getItem('lego-locale')).toBe(null);
    expect(setLocale('xx')).toBe(false);
    expect(setLocale('en')).toBe(false); // та сама мова — без змін
    expect(getLocale()).toBe('en');
  });

  it('pickLocale: збережена відома мова → мова браузера (uk у тестах)', () => {
    expect(pickLocale('en')).toBe('en');
    expect(pickLocale('xx')).toBe('uk');
    expect(pickLocale(null)).toBe('uk');
  });

  it('translateDom(root): текст, атрибути й lang на root, а не на <html>', () => {
    document.documentElement.lang = 'uk';
    setLocale('en');
    translateDom(root);
    expect(root.lang).toBe('en');
    expect(document.documentElement.lang).toBe('uk');
    expect(ref('csv').textContent).toBe('CSV for designer');
    expect(ref('locale').getAttribute('aria-label')).toBe('Interface language');
    setLocale('uk');
    translateDom(root);
    expect(ref('csv').textContent).toBe('CSV для дизайнера');
  });

  it('addMessages: перекриває ключ і додає мову; відсутні ключі нової мови — з uk', () => {
    addMessages({ uk: { test: { hello: 'Привіт' } }, de: { toolbar: { csv: 'CSV für Designer' } } });
    expect(t('test.hello')).toBe('Привіт');
    expect(t('toolbar.copy')).toBe('Копіювати список'); // решта словника на місці
    expect(LOCALES).toContain('de');
    setLocale('de');
    expect(t('toolbar.csv')).toBe('CSV für Designer');
    expect(t('toolbar.copy')).toBe('Копіювати список');
  });
});
