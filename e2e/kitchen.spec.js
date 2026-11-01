import { writeFileSync } from 'node:fs';
import { test, expect, open, download, expectGolden } from './fixtures.js';

// Очікування задані тут, а не імпортом з src: тест має ловити й випадкові зміни пресетів.
const PRESETS = {
  line240: { H: 720, D: 560, legs: 100, modules: 4, file: 'kukhnia-2400x858x590' },
  line180: { H: 720, D: 560, legs: 100, modules: 3, file: 'kukhnia-1800x858x590' },
  base60: { H: 720, D: 560, legs: 100, modules: 1, file: 'kukhnia-600x858x590' },
};

const preset = (page, key) => page.click(`[data-preset="kitchen.${key}"]`);
const modules = page => page.locator('[data-module]');
const mod = (i, sel) => `[data-module="${i}"] ${sel}`;

test.beforeEach(async ({ page }) => open(page));

test('пресети кухні заповнюють корпус і модулі', async ({ page }) => {
  for (const [key, p] of Object.entries(PRESETS)) {
    await preset(page, key);
    for (const k of ['H', 'D', 'legs']) await expect(page.locator('#' + k)).toHaveValue(String(p[k]));
    await expect(modules(page)).toHaveCount(p.modules);
    await expect(page.locator(`[data-preset="kitchen.${key}"]`)).toHaveAttribute('aria-pressed', 'true');
    // форма шафи прибрана
    await expect(page.locator('#W')).toHaveCount(0);
    await expect(page.locator('[data-section]')).toHaveCount(0);
  }
});

test('редагування модулів', async ({ page }) => {
  await preset(page, 'line180');
  await page.click('#addModule');
  await expect(modules(page)).toHaveCount(4);

  await page.selectOption(mod(3, '[data-field="mType"]'), 'drawers');
  await expect(page.locator(mod(3, '[data-field="mCount"]'))).toHaveValue('3'); // типова кількість ящиків
  await page.selectOption(mod(3, '[data-field="mType"]'), 'sink');
  await expect(page.locator(mod(3, '[data-field="mCount"]'))).toBeDisabled();

  await page.click(mod(0, '[data-act="modDup"]'));
  await expect(modules(page)).toHaveCount(5);
  await page.click(mod(4, '[data-act="modDel"]'));
  await expect(modules(page)).toHaveCount(4);

  // вузький модуль — помилка; повернули ширину — зникла
  await page.fill(mod(1, '[data-field="mWidth"]'), '100');
  await expect(page.locator('[data-msg="error"]')).toHaveCount(1);
  await page.fill(mod(1, '[data-field="mWidth"]'), '600');
  await expect(page.locator('[data-msg="error"]')).toHaveCount(0);

  await page.fill('#legs', '150');
  await expect(page.locator('#legs')).toHaveValue('150');
});

test('еталонні CSV і JSON кухні', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'еталони перевіряємо в одному браузері');
  for (const [key, p] of Object.entries(PRESETS)) {
    await preset(page, key);
    const csv = await download(page, '#csv');
    expect(csv.name).toBe(`${p.file}.csv`);
    expectGolden(`kitchen.${key}.csv`, csv.text);
    const json = await download(page, '#saveJson');
    expect(json.name).toBe(`${p.file}.json`);
    expectGolden(`kitchen.${key}.json`, json.text);
  }
});

test('збереження й відкриття JSON кухні', async ({ page }, info) => {
  await preset(page, 'line240');
  await page.fill('#H', '700');
  const json = await download(page, '#saveJson');
  expect(JSON.parse(json.text)).toMatchObject({ version: 2, type: 'kitchen', H: 700 });
  const file = info.outputPath('kitchen.json');
  writeFileSync(file, json.text);

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#W')).toBeVisible(); // за замовчуванням — шафа

  await page.setInputFiles('#fileIn', file);
  await expect(page.locator('#H')).toHaveValue('700');
  await expect(modules(page)).toHaveCount(4);
  await page.reload();
  await expect(page.locator('#H')).toHaveValue('700'); // і переживає перезавантаження
});

test('зміна типу зі зміненим проєктом — з підтвердженням', async ({ page }) => {
  // незмінений проєкт (пресет) — перемикається одразу
  await preset(page, 'line180');
  await expect(modules(page)).toHaveCount(3);

  await page.fill('#H', '700');
  await page.click('[data-preset="wardrobe.komod"]');
  await expect(page.locator('#modal')).toHaveAttribute('open', '');
  // скасування — лишаємось на кухні зі змінами
  await page.locator('#modal button[data-modal-close]').first().click();
  await expect(page.locator('#modal')).not.toHaveAttribute('open', '');
  await expect(page.locator('#H')).toHaveValue('700');

  await page.click('[data-preset="wardrobe.komod"]');
  await page.click('#modalSubmit');
  await expect(page.locator('#W')).toHaveValue('1000');
  await expect(page.locator('[data-section]')).toHaveCount(1);
});

test('375 px: кухня без горизонтального скролу', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'лише мобільний');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.click('#reportToggle');
  for (const key of Object.keys(PRESETS)) {
    await preset(page, key);
    const m = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: window.innerWidth,
      font: parseFloat(getComputedStyle(document.querySelector('[data-field="mWidth"]')).fontSize),
    }));
    expect(m.scroll, key).toBeLessThanOrEqual(m.width);
    expect(m.font, key).toBeGreaterThanOrEqual(16);
  }
});
