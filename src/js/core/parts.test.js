import { describe, it, expect } from 'vitest';
import { computeLayout } from './layout.js';
import { partsList, sheetTotals, describe as describeSections } from './parts.js';
import { MATERIALS } from '../config/materials.js';
import { preset, project } from './test-fixtures.js';

const specOf = s => partsList(s, computeLayout(s));
const panel = (P, key, a, b) => P.panels.find(p => p.key === key && p.a === a && p.b === b);

describe('partsList — пресет «Шафа 3 секції»', () => {
  const P = specOf(preset('wardrobe'));

  it('корпус', () => {
    expect(panel(P, 'part.side', 2400, 600).q).toBe(2);
    expect(panel(P, 'part.top', 1768, 600).q).toBe(1);
    expect(panel(P, 'part.bottom', 1768, 600).q).toBe(1);
    expect(panel(P, 'part.plinth', 1768, 80).q).toBe(1);
    expect(panel(P, 'part.divider', 2288, 600).q).toBe(2);
    expect(panel(P, 'part.back', 2396, 1796).q).toBe(1);
  });

  it('групує однакові деталі й сумує кількість', () => {
    expect(panel(P, 'part.zoneShelf', 568, 600).q).toBe(3); // 2 у секції 1 + 1 у секції 3
    expect(panel(P, 'part.zoneShelf', 600, 600).q).toBe(1);
    expect(panel(P, 'part.shelf', 600, 580).q).toBe(3);
  });

  it('фурнітура та блоки', () => {
    expect(P.items).toEqual([
      { key: 'part.rod', size: { key: 'itemSize.rod', params: { w: 568 } }, q: 3 },
      { key: 'part.drawer', size: { key: 'itemSize.drawer', params: { w: 594, h: 196, d: 550 } }, q: 3 },
    ]);
  });

  it('специфікація машиночитна: лише ключі та числа', () => {
    P.panels.forEach(p => {
      expect(p.key).toMatch(/^part\./);
      expect(Object.keys(MATERIALS)).toContain(p.mat);
      expect([p.a, p.b, p.q].every(Number.isInteger)).toBe(true);
    });
  });
});

describe('partsList — умовні деталі', () => {
  it('без цоколя немає деталі «Цоколь»', () => {
    expect(specOf(preset('tumba')).panels.some(p => p.key === 'part.plinth')).toBe(false);
  });

  it('одна секція — без перегородок', () => {
    expect(specOf(preset('komod')).panels.some(p => p.key === 'part.divider')).toBe(false);
  });

  it('без штанг і ящиків список фурнітури порожній', () => {
    const s = project([{ width: 'auto', zones: [{ type: 'shelves', count: 2, height: 'auto' }] }]);
    expect(specOf(s).items).toEqual([]);
  });
});

describe('sheetTotals', () => {
  it('пресет «Шафа 3 секції»: площа й листи по матеріалах', () => {
    const P = specOf(preset('wardrobe'));
    // ДСП, мм²: боковини 2400*600*2 = 2 880 000; кришка + дно 1768*600*2 = 2 121 600;
    // цоколь 1768*80 = 141 440; перегородки 2288*600*2 = 2 745 600;
    // полиці між зонами 568*600*3 + 600*600 = 1 382 400; полиці 600*580*3 = 1 044 000
    // разом 10 315 040 мм² ≈ 10.32 м²; лист 2800*2070 = 5 796 000 → 1.78 → 2 листи
    // ДВП: задня стінка 2396*1796 = 4 303 216 мм² ≈ 4.30 м² → 1 лист
    expect(sheetTotals(P.panels)).toEqual([
      { mat: 'chipboard', area: 10.32, sheet: { a: 2800, b: 2070 }, sheets: 2 },
      { mat: 'hardboard', area: 4.3, sheet: { a: 2800, b: 2070 }, sheets: 1 },
    ]);
  });

  it('площа рівно на лист — один лист, без зайвого', () => {
    expect(sheetTotals([{ key: 'part.side', mat: 'chipboard', a: 2800, b: 2070, q: 1 }])[0].sheets).toBe(1);
    expect(
      sheetTotals([
        { key: 'part.side', mat: 'chipboard', a: 2800, b: 2070, q: 1 },
        { key: 'part.shelf', mat: 'chipboard', a: 1, b: 1, q: 1 },
      ])[0].sheets,
    ).toBe(2);
  });

  it('матеріали без деталей не потрапляють у підсумок', () => {
    expect(sheetTotals([{ key: 'part.shelf', mat: 'chipboard', a: 1000, b: 500, q: 2 }])).toEqual([
      { mat: 'chipboard', area: 1, sheet: { a: 2800, b: 2070 }, sheets: 1 }, // 1000*500*2 = 1 м²
    ]);
    expect(sheetTotals([])).toEqual([]);
  });
});

describe('describe', () => {
  it('описує секції та зони ключами', () => {
    const L = computeLayout(preset('wardrobe'));
    expect(describeSections(L)[1]).toEqual({
      key: 'describe.section',
      params: { n: 2, w: 600 },
      zones: [
        { key: 'describe.shelves', params: { cnt: 3, h: 1672 } },
        { key: 'describe.drawers', params: { cnt: 3, front: 196, h: 600 } },
      ],
    });
  });
});
