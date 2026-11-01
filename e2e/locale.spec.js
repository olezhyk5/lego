import { test, expect, open, download } from './fixtures.js';

// Фікстура фіксує мову uk; тут мову перемикаємо явно через #locale.
test.beforeEach(async ({ page }) => open(page));

test('перемикання мови без перезавантаження, проєкт зберігається', async ({ page }) => {
  await page.click('[data-preset="wardrobe.komod"]');
  await page.fill('#W', '1100');
  await expect(page.locator('html')).toHaveAttribute('lang', 'uk');

  await page.selectOption('#locale', 'en');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#csv')).toHaveText('CSV for designer');
  await expect(page.locator('[data-preset="wardrobe.komod"]')).toHaveText('Chest of drawers');
  // форму перемонтовано, значення й вибір пресета ті самі
  await expect(page.locator('#W')).toHaveValue('1100');
  await expect(page.locator('[data-section]')).toHaveCount(1);
  await expect(page.locator('[data-preset="wardrobe.komod"]')).toHaveAttribute('aria-pressed', 'true');

  const csv = await download(page, '#csv');
  expect(csv.text).toContain('"Part";"Size, mm";"Qty"');
  expect(csv.text).toContain('"Side panel"');

  // вибір збережено для наступних відкриттів (перезавантаження тут не перевіряємо: фікстура
  // перед кожним завантаженням сторінки ставить uk)
  expect(await page.evaluate(() => localStorage.getItem('lego-locale'))).toBe('en');

  await page.selectOption('#locale', 'uk');
  await expect(page.locator('#csv')).toHaveText('CSV для дизайнера');
  await expect(page.locator('#W')).toHaveValue('1100');
});

test('кухня англійською: форма модулів перекладена', async ({ page }) => {
  await page.click('[data-preset="kitchen.line180"]');
  await page.selectOption('#locale', 'en');
  await expect(page.locator('#addModule')).toHaveText('+ Add module');
  await expect(page.locator('[data-module]')).toHaveCount(3);
});
