import { join } from 'node:path';
import { test, expect, open, ref } from './fixtures.js';

// Вбудовування: index.html запускає lego через window.lego (як сайт клієнта); тут на ту саму сторінку
// додаємо другий екземпляр і перевіряємо, що копії незалежні, а destroy звільняє WebGL і розмітку.

const second = '[data-test="second"]';
const inSecond = sel => `${second} ${sel}`;
const inMain = sel => `[data-lego] ${sel}`;

// Другий екземпляр у новому елементі; посилання на нього — window.__second
const mountSecond = (page, options = {}) =>
  page.evaluate(opts => {
    let el = document.querySelector('[data-test="second"]');
    if (!el) {
      el = document.createElement('div');
      el.dataset.test = 'second';
      document.body.appendChild(el);
    }
    window.__second = window.lego.createConfigurator(el, opts);
  }, options);

test.beforeEach(async ({ page }) => open(page));

test('два екземпляри на сторінці незалежні', async ({ page }) => {
  await mountSecond(page, { storage: false, ui: { presets: false, files: false, locale: false } });
  await expect(page.locator('canvas')).toHaveCount(2);

  await page.fill(inSecond(ref('W')), '1500');
  await expect(page.locator(inSecond(ref('W')))).toHaveValue('1500');
  await expect(page.locator(inMain(ref('W')))).toHaveValue('1800');

  // вимкнені опцією частини відсутні лише в другому
  await expect(page.locator(inSecond(ref('presets')))).toHaveCount(0);
  await expect(page.locator(inSecond(ref('saveJson')))).toHaveCount(0);
  await expect(page.locator(inSecond(ref('csv')))).toHaveCount(1);
  await expect(page.locator(inMain(ref('presets')))).toHaveCount(1);

  // попап — лише свого екземпляра
  await page.click(inSecond(ref('doorSettings')));
  await expect(page.locator(inSecond(ref('modal')))).toHaveAttribute('open', '');
  await expect(page.locator(inMain(ref('modal')))).not.toHaveAttribute('open', '');
  await page
    .locator(inSecond(`${ref('modal')} button[data-modal-close]`))
    .first()
    .click();

  // другий (storage: false) не перезаписав збережений проєкт основного
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lego-project')).W)).toBe(1800);

  const ids = await page.evaluate(() => [...document.querySelectorAll('[id]')].map(el => el.id));
  expect(new Set(ids).size).toBe(ids.length);
});

test('destroy знімає екземпляр, повторне створення працює', async ({ page }) => {
  for (let i = 0; i < 3; i++) {
    await mountSecond(page, { storage: false });
    await expect(page.locator('canvas')).toHaveCount(2);
    await expect(page.locator(inSecond('[data-section]'))).toHaveCount(3);
    await page.evaluate(() => window.__second.destroy());
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.locator(second)).toBeEmpty();
  }
  // основний екземпляр після цього працює
  await page.fill(inMain(ref('W')), '1300');
  await expect(page.locator(inMain(ref('W')))).toHaveValue('1300');
});

test('окремий блок кухонь: свої пресети й ключ сховища, файл шафи не відкривається', async ({ page }) => {
  await mountSecond(page, { presets: ['kitchen'], preset: 'kitchen.base60', storageKey: 'kitchen-block' });
  const presets = page.locator(inSecond('[data-preset]'));
  expect(
    (await presets.evaluateAll(els => els.map(b => b.dataset.preset))).every(id => id.startsWith('kitchen.')),
  ).toBe(true);
  await expect(page.locator(inSecond('[data-preset="kitchen.base60"]'))).toHaveAttribute('aria-pressed', 'true');

  // проєкт блоку — у своєму ключі, основний екземпляр (lego-project) не зачеплено
  await page.fill(inSecond(ref('H')), '700');
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('kitchen-block-project')).H)).toBe(700);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('lego-project')).type)).toBe('wardrobe');

  // файл шафи — повідомлення, проєкт блоку не змінюється
  await page.setInputFiles(inSecond(ref('fileIn')), join(import.meta.dirname, 'files/v1-komod.json'));
  await expect(page.locator(inSecond(ref('toast')))).not.toBeEmpty();
  await expect(page.locator(inSecond(ref('H')))).toHaveValue('700');
});
