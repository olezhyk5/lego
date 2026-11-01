// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setupDom } from './test-dom.js';
import { t, setLocale, getLocale, translateDom, LOCALES } from '../i18n/index.js';

beforeEach(setupDom);
afterEach(() => setLocale('uk'));

describe('мова інтерфейсу', () => {
  it('є українська й англійська', () => expect(LOCALES).toEqual(['uk', 'en']));

  it('setLocale змінює t() і зберігає вибір; невідома мова ігнорується', () => {
    setLocale('en');
    expect(getLocale()).toBe('en');
    expect(t('section.name', { n: 2 })).toBe('Section 2');
    expect(localStorage.getItem('lego-locale')).toBe('en');
    setLocale('xx');
    expect(getLocale()).toBe('en');
  });

  it('translateDom: текст, атрибути й lang', () => {
    setLocale('en');
    translateDom();
    expect(document.documentElement.lang).toBe('en');
    expect(document.querySelector('#csv').textContent).toBe('CSV for designer');
    expect(document.querySelector('#locale').getAttribute('aria-label')).toBe('Interface language');
    setLocale('uk');
    translateDom();
    expect(document.querySelector('#csv').textContent).toBe('CSV для дизайнера');
  });
});
