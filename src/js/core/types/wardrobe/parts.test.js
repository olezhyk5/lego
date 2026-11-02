import { describe, it, expect } from 'vitest';
import { computeLayout } from './layout.js';
import { partsList, summary, describe as describeSections } from './parts.js';
import { sheetTotals } from '../../common/sheets.js';
import { MATERIALS } from '../../../config/materials.js';
import { preset, PLINTH, project } from '../../test-fixtures.js';

const specOf = s => partsList(s, computeLayout(s));
const panel = (P, key, a, b) => P.panels.find(p => p.key === key && p.a === a && p.b === b);

describe('partsList — пресет «Шафа 3 секції» на цоколі', () => {
  const P = specOf(preset('wardrobe', PLINTH));

  it('корпус', () => {
    expect(panel(P, 'part.side', 2400, 600).q).toBe(2);
    expect(panel(P, 'part.top', 1768, 600).q).toBe(1);
    expect(panel(P, 'part.bottom', 1768, 600).q).toBe(1);
    expect(panel(P, 'part.plinth', 1768, 80).q).toBe(1);
    expect(panel(P, 'part.divider', 2288, 600).q).toBe(2);
    expect(panel(P, 'part.back', 2318, 1796).q).toBe(1); // 2400 - 2 - 80
  });

  it('групує однакові деталі й сумує кількість', () => {
    expect(panel(P, 'part.zoneShelf', 568, 600).q).toBe(3); // 2 у секції 1 + 1 у секції 3
    expect(panel(P, 'part.zoneShelf', 600, 600).q).toBe(1);
    expect(panel(P, 'part.shelf', 600, 580).q).toBe(3);
  });

  it('фасади шухляд — окремі плити ДСП', () => {
    // секція 2: 600 мм, зона шухляд 600 мм ×3; ширина 600 - 2*3 = 594, висота (600 - 4*3) / 3 = 196
    expect(panel(P, 'part.drawerFront', 594, 196)).toEqual({
      key: 'part.drawerFront',
      mat: 'chipboard',
      a: 594,
      b: 196,
      q: 3,
    });
  });

  it('фурнітура та блоки', () => {
    expect(P.items).toEqual([
      { key: 'part.rod', size: { key: 'itemSize.rod', params: { w: 568 } }, q: 3 },
      { key: 'part.drawer', size: { key: 'itemSize.drawer', params: { w: 594, h: 196, d: 550 } }, q: 3 },
      { key: 'part.handle', size: { key: 'itemSize.handle' }, q: 3 }, // по ручці на фасад
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

describe('partsList — кришка над боковинами', () => {
  const P = specOf({ ...preset('wardrobe', PLINTH), top: { mount: 'over' } });

  it('боковини коротші на товщину кришки, кришка на всю ширину', () => {
    expect(panel(P, 'part.side', 2384, 600).q).toBe(2); // 2400 - 16
    expect(panel(P, 'part.top', 1800, 600).q).toBe(1); // W
    expect(P.panels.some(p => p.key === 'part.side' && p.a === 2400)).toBe(false);
  });

  it('решта корпусу не змінюється', () => {
    expect(panel(P, 'part.bottom', 1768, 600).q).toBe(1);
    expect(panel(P, 'part.divider', 2288, 600).q).toBe(2);
    expect(panel(P, 'part.back', 2318, 1796).q).toBe(1); // 2400 - 2 - 80
  });
});

describe('partsList — виступи кришки', () => {
  it('кришка більша на виступи, задня стінка закінчується під кришкою', () => {
    const P = specOf({
      ...preset('wardrobe', PLINTH),
      top: { mount: 'over', overhang: { back: 10, front: 20, left: 30, right: 40 } },
    });
    expect(panel(P, 'part.top', 1870, 630).q).toBe(1); // 1800 + 30 + 40; 600 + 10 + 20
    expect(panel(P, 'part.back', 2302, 1796).q).toBe(1); // 2400 - 16 - 2 - 80
    expect(panel(P, 'part.side', 2384, 600).q).toBe(2);
  });

  it('без виступу ззаду задня стінка як без виступів', () => {
    const P = specOf({ ...preset('wardrobe', PLINTH), top: { mount: 'over', overhang: { front: 20 } } });
    expect(panel(P, 'part.top', 1800, 620).q).toBe(1); // 600 + 20
    expect(panel(P, 'part.back', 2318, 1796).q).toBe(1); // 2400 - 2 - 80
  });
});

describe('partsList — потовщена кришка', () => {
  it('між боковинами: дві плити кришки, перегородки коротші на 16', () => {
    const P = specOf({ ...preset('wardrobe', PLINTH), top: { mount: 'between', double: true } });
    expect(panel(P, 'part.top', 1768, 600).q).toBe(2);
    expect(panel(P, 'part.side', 2400, 600).q).toBe(2);
    expect(panel(P, 'part.divider', 2272, 600).q).toBe(2); // 2400 - 80 - 16 - 2*16
  });

  it('над боковинами: дві плити на всю ширину, боковини 2400 - 2*16', () => {
    const P = specOf({ ...preset('wardrobe', PLINTH), top: { mount: 'over', double: true } });
    expect(panel(P, 'part.top', 1800, 600).q).toBe(2);
    expect(panel(P, 'part.side', 2368, 600).q).toBe(2);
  });
});

describe('partsList — умовні деталі', () => {
  it('без цоколя немає деталі «Цоколь»', () => {
    expect(specOf(preset('tumba')).panels.some(p => p.key === 'part.plinth')).toBe(false);
  });

  it('одна секція — без перегородок', () => {
    expect(specOf(preset('komod')).panels.some(p => p.key === 'part.divider')).toBe(false);
  });

  it('без шухляд немає фасадів шухляд', () => {
    const s = project([{ width: 'auto', zones: [{ type: 'shelves', count: 2, height: 'auto' }] }]);
    expect(specOf(s).panels.some(p => p.key === 'part.drawerFront')).toBe(false);
  });

  it('без штанг і шухляд список фурнітури порожній', () => {
    const s = project([{ width: 'auto', zones: [{ type: 'shelves', count: 2, height: 'auto' }] }]);
    expect(specOf(s).items).toEqual([]);
  });
});

describe('sheetTotals', () => {
  it('пресет «Шафа 3 секції»: площа й листи по матеріалах', () => {
    const P = specOf(preset('wardrobe', PLINTH));
    // ДСП, мм²: боковини 2400*600*2 = 2 880 000; кришка + дно 1768*600*2 = 2 121 600;
    // цоколь 1768*80 = 141 440; перегородки 2288*600*2 = 2 745 600;
    // полиці між зонами 568*600*3 + 600*600 = 1 382 400; полиці 600*580*3 = 1 044 000;
    // фасади шухляд 594*196*3 = 349 272
    // разом 10 664 312 мм² ≈ 10.66 м²; лист 2800*2070 = 5 796 000 → 1.84 → 2 листи
    // ДВП: задня стінка 2318*1796 = 4 163 128 мм² ≈ 4.16 м² → 1 лист
    expect(sheetTotals(P.panels)).toEqual([
      { mat: 'chipboard', area: 10.66, sheet: { a: 2800, b: 2070 }, sheets: 2 },
      { mat: 'hardboard', area: 4.16, sheet: { a: 2800, b: 2070 }, sheets: 1 },
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
    const s = preset('wardrobe', PLINTH);
    const L = computeLayout(s);
    expect(describeSections(s, L)[1]).toEqual({
      key: 'describe.section',
      params: { n: 2, w: 600 },
      children: [
        { key: 'describe.shelves', params: { cnt: 3, h: 1672 } },
        { key: 'describe.drawers', params: { cnt: 3, front: 196, h: 600 } },
      ],
    });
  });
});

// Пресет «Шафа 3 секції» на регульованих опорах 80 мм: плити ті самі, що на цоколі.
// Ряди ніжок: впритул до боковин x = 16 і 1800 - 16 - 40 = 1744; по осях перегородок 584 + 8 - 20 = 572, 1200 + 8 - 20 = 1188.
// Кроки 556, 616, 556 ≤ 700 — проміжних немає: 4 ряди × 2 = 8 ніжок.
describe('partsList — пресет «Шафа 3 секції» на опорах', () => {
  const s = preset('wardrobe');
  const L = computeLayout(s);
  const P = partsList(s, L);

  it('боковини до підлоги, цоколь між ними', () => {
    expect(s.base).toBe('legs');
    expect(panel(P, 'part.side', 2400, 600).q).toBe(2);
    expect(panel(P, 'part.top', 1768, 600).q).toBe(1);
    expect(panel(P, 'part.bottom', 1768, 600).q).toBe(1);
    expect(panel(P, 'part.plinth', 1768, 80).q).toBe(1); // 1800 - 2*16
    expect(panel(P, 'part.divider', 2288, 600).q).toBe(2); // 2384 - 96
    expect(panel(P, 'part.back', 2318, 1796).q).toBe(1); // 2400 - 2 - 80
  });

  it('ніжки — останні у фурнітурі', () => {
    expect(L.legs).toEqual([16, 572, 1188, 1744]);
    expect(P.items.at(-1)).toEqual({ key: 'part.leg', size: { key: 'itemSize.leg', params: { h: 80 } }, q: 8 });
  });

  it('у шапці — цоколь на опорах', () => {
    expect(summary(s, L)[1]).toEqual({
      label: { key: 'export.plinth' },
      value: { key: 'export.plinthOnLegs', params: { h: 80 } },
    });
  });

  it('кришка над боковинами: боковини 2400 - 16', () => {
    expect(panel(specOf({ ...s, top: { mount: 'over' } }), 'part.side', 2384, 600).q).toBe(2);
  });
});

describe('partsList — ніжки за шириною', () => {
  it('одна секція 2000: від 16 до 1944 — 1928 > 2*700 → 3 проміжки, 4 ряди', () => {
    const s = project([{ width: 'auto', zones: [{ type: 'empty', height: 'auto' }] }], { W: 2000, base: 'legs' });
    const L = computeLayout(s);
    L.legs.forEach((x, k) => expect(x).toBeCloseTo([16, 658.67, 1301.33, 1944][k], 2)); // 16 + k * 1928 / 3
    expect(partsList(s, L).items).toEqual([
      { key: 'part.leg', size: { key: 'itemSize.leg', params: { h: 80 } }, q: 8 },
    ]);
  });

  it('висота 0 — ні ніжок, ні цоколя', () => {
    const s = project([{ width: 'auto', zones: [{ type: 'empty', height: 'auto' }] }], { plinth: 0, base: 'legs' });
    const P = specOf(s);
    expect(P.items).toEqual([]);
    expect(P.panels.some(p => p.key === 'part.plinth')).toBe(false);
    expect(panel(P, 'part.side', 2000, 600).q).toBe(2);
  });

  it('на цоколі ніжок немає', () => {
    expect(specOf(preset('wardrobe', PLINTH)).items.some(i => i.key === 'part.leg')).toBe(false);
  });
});
