import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test as base, expect } from '@playwright/test';

export { expect };

const GOLDEN_DIR = join(import.meta.dirname, 'golden');

// page з фіксованою мовою (uk) і перевіркою, що в консолі немає помилок.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => {
      // браузер сам просить /favicon.ico, якого в теми немає
      if (m.type() === 'error' && !m.location().url.endsWith('/favicon.ico')) errors.push(m.text());
    });
    await page.addInitScript(() => localStorage.setItem('lego-locale', 'uk'));
    await use(page);
    expect(errors, 'помилки в консолі').toEqual([]);
  },
});

export const open = page => page.goto('/index.html');

// Вміст завантаженого файлу після кліку по кнопці
export async function download(page, selector) {
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click(selector)]);
  return { name: dl.suggestedFilename(), text: readFileSync(await dl.path(), 'utf8') };
}

// Порівняння з еталонним файлом у e2e/golden/. UPDATE_GOLDEN=1 — перезаписати еталон.
export function expectGolden(name, text) {
  const file = join(GOLDEN_DIR, name);
  if (process.env.UPDATE_GOLDEN) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, text);
    return;
  }
  expect(text, `еталон ${name} (оновити: npm run test:e2e:golden)`).toBe(readFileSync(file, 'utf8'));
}
