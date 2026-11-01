import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect, open, download, expectGolden } from './fixtures.js';

// Очікування задані тут, а не імпортом з src: тест має ловити й випадкові зміни пресетів.
const PRESETS = {
  wardrobe: { W: 1800, H: 2400, D: 600, plinth: 80, sections: 3 },
  wardrobe2: { W: 1200, H: 2200, D: 600, plinth: 80, sections: 2 },
  komod: { W: 1000, H: 900, D: 450, plinth: 60, sections: 1 },
  tumba: { W: 600, H: 700, D: 400, plinth: 0, sections: 1 },
  penal: { W: 450, H: 2100, D: 400, plinth: 80, sections: 1 },
};

const preset = (page, key) => page.click(`[data-preset="wardrobe.${key}"]`);
const sections = page => page.locator('[data-section]');
const zones = (page, i) => page.locator(`[data-section="${i}"] [data-zone]`);
const sec = (i, sel) => `[data-section="${i}"] ${sel}`;

test.beforeEach(async ({ page }) => open(page));

test('пресети заповнюють габарити й секції', async ({ page }) => {
  for (const [key, p] of Object.entries(PRESETS)) {
    await preset(page, key);
    for (const k of ['W', 'H', 'D', 'plinth']) await expect(page.locator('#' + k)).toHaveValue(String(p[k]));
    await expect(sections(page)).toHaveCount(p.sections);
    await expect(page.locator(`[data-preset="wardrobe.${key}"]`)).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-preset][aria-pressed="true"]')).toHaveCount(1);
  }
});

test('редагування секцій і зон', async ({ page }) => {
  await preset(page, 'wardrobe2');
  await expect(sections(page)).toHaveCount(2);

  await page.click(sec(0, '[data-act="secDup"]'));
  await expect(sections(page)).toHaveCount(3);
  // останній вибраний пресет лишається підсвіченим і після змін
  await expect(page.locator('[data-preset="wardrobe.wardrobe2"]')).toHaveAttribute('aria-pressed', 'true');

  await page.fill(sec(1, '[data-field="secWidth"]'), '400');
  await page.selectOption(sec(1, '[data-zone="0"] [data-field="zType"]'), 'drawers');
  await page.fill(sec(1, '[data-zone="0"] [data-field="zCount"]'), '4');
  await expect(page.locator(sec(1, '[data-zone="0"] [data-field="zCount"]'))).toHaveValue('4');

  await page.click(sec(2, '[data-act="zAdd"]'));
  await expect(zones(page, 2)).toHaveCount(4);
  await page.click(sec(2, '[data-zone="3"] [data-act="zDel"]'));
  await expect(zones(page, 2)).toHaveCount(3);

  await page.click(sec(2, '[data-act="secDel"]'));
  await expect(sections(page)).toHaveCount(2);

  // усі ширини фіксовані й не сходяться → помилка; повернули «авто» → зникла
  await page.fill(sec(0, '[data-field="secWidth"]'), '300');
  await expect(page.locator('[data-msg="error"]')).toHaveCount(1);
  await page.fill(sec(0, '[data-field="secWidth"]'), '');
  await expect(page.locator('[data-msg="error"]')).toHaveCount(0);

  await page.fill('#W', '1300');
  await expect(page.locator('#W')).toHaveValue('1300');
});

test('еталонні CSV і JSON для кожного пресета', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'еталони перевіряємо в одному браузері');
  for (const key of Object.keys(PRESETS)) {
    await preset(page, key);
    const csv = await download(page, '#csv');
    const p = PRESETS[key];
    expect(csv.name).toBe(`shafa-${p.W}x${p.H}x${p.D}.csv`);
    expect(csv.text.startsWith('﻿')).toBe(true);
    expectGolden(`${key}.csv`, csv.text);
    const json = await download(page, '#saveJson');
    expect(json.name).toBe(`shafa-${p.W}x${p.H}x${p.D}.json`);
    expectGolden(`${key}.json`, json.text);
  }
});

test('збереження й відкриття JSON', async ({ page }, info) => {
  await preset(page, 'penal');
  await page.fill('#H', '2000');
  const json = await download(page, '#saveJson');
  const saved = JSON.parse(json.text);
  expect(saved).toMatchObject({ version: 2, type: 'wardrobe', H: 2000 });
  expect(saved.sections).toHaveLength(1);

  const file = info.outputPath('project.json');
  writeFileSync(file, json.text);

  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.locator('#H')).toHaveValue(String(PRESETS.wardrobe.H));

  await page.setInputFiles('#fileIn', file);
  await expect(page.locator('#H')).toHaveValue('2000');
  await expect(page.locator('#W')).toHaveValue(String(PRESETS.penal.W));
  await expect(sections(page)).toHaveCount(1);
  await expect(zones(page, 0)).toHaveCount(2);
  await expect(page.locator('#toast')).not.toBeEmpty();

  // зіпсований JSON і файл з неправильною структурою не змінюють проєкт
  for (const name of ['broken.json', 'invalid-zone.json']) {
    await page.evaluate(() => (document.querySelector('#toast').textContent = ''));
    await page.setInputFiles('#fileIn', join(import.meta.dirname, 'files', name));
    await expect(page.locator('#toast'), name).not.toBeEmpty();
    await expect(page.locator('#H'), name).toHaveValue('2000');
  }
});

test('файл старого формату (v1) відкривається', async ({ page }) => {
  await page.setInputFiles('#fileIn', join(import.meta.dirname, 'files/v1-komod.json'));
  for (const k of ['W', 'H', 'D', 'plinth']) await expect(page.locator('#' + k)).toHaveValue(String(PRESETS.komod[k]));
  await expect(page.locator('[data-preset="wardrobe.komod"]')).toHaveAttribute('aria-pressed', 'true');
  const json = await download(page, '#saveJson');
  expect(JSON.parse(json.text)).toMatchObject({ version: 2, type: 'wardrobe' });
});

test('проєкт переживає перезавантаження', async ({ page }) => {
  await preset(page, 'komod');
  await page.fill('#W', '1100');
  await page.reload();
  await expect(page.locator('#W')).toHaveValue('1100');
  await expect(page.locator('[data-preset="wardrobe.komod"]')).toHaveAttribute('aria-pressed', 'true');
});

test('375 px: без горизонтального скролу', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile', 'лише мобільний');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.click('#reportToggle');
  for (const key of Object.keys(PRESETS)) {
    await preset(page, key);
    const m = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: window.innerWidth,
      viewer: document.querySelector('#view').getBoundingClientRect().height,
      height: window.innerHeight,
      font: parseFloat(getComputedStyle(document.querySelector('#W')).fontSize),
    }));
    expect(m.scroll, key).toBeLessThanOrEqual(m.width);
    expect(m.viewer, key).toBeLessThan(m.height);
    expect(m.font, key).toBeGreaterThanOrEqual(16);
  }
});
