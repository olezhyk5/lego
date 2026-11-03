import { describe, it, expect } from 'vitest';
import { computeLayout, moduleCount, worktopOf, drawerFront, legColumns } from './layout.js';
import { kitchenPreset, kitchen, keys } from '../../test-fixtures.js';

// Пресет «Кухня 2,4 м»: H 720, D 560, ніжки 100, стільниця 38 з виступом 30 спереду.
// Модулі: шухляди 600 (3), мийка 800, двері 600 (1), відкритий 400 (2 полиці). T 16, GAP 3.
describe('computeLayout — пресет «Кухня 2,4 м»', () => {
  const L = computeLayout(kitchenPreset('line240'));

  it('ширина, висота, стільниця, габарити', () => {
    expect(L.W).toBe(2400); // 600 + 800 + 600 + 400
    expect(L.Htot).toBe(858); // 100 + 720 + 38
    expect(L.worktop).toMatchObject({ x: 0, w: 2400, d: 590, t: 38 }); // 560 + 30
    expect(L.bounds).toEqual({ W: 2400, H: 858, D: 590 });
    expect(L.modules.map(m => m.x)).toEqual([0, 600, 1400, 2000]);
  });

  it('без помилок і попереджень', () => {
    expect(L.errs).toEqual([]);
    expect(L.warns).toEqual([]);
  });

  it('шухляди: фасад (720 - 4*3) / 3 = 236, ширина 600 - 2*3', () => {
    expect(L.modules[0].fronts).toEqual(
      [103, 342, 581].map(y => ({ key: 'part.drawerFront', x: 3, y, w: 594, h: 236 })), // 100 + 3, крок 236 + 3
    );
  });

  it('мийка 800: двоє дверей (800 - 2*3 - 3) / 2 = 395,5, висота 720 - 2*3', () => {
    const f = L.modules[1].fronts;
    expect(f.map(d => [d.x, d.w, d.h])).toEqual([
      [603, 395.5, 714],
      [1001.5, 395.5, 714], // 603 + 395,5 + 3
    ]);
    expect(L.modules[1].shelves).toEqual([]);
  });

  it('полиці посередині між дном і царгами', () => {
    // всередині 720 - 2*16 = 688; одна полиця: (688 - 16) / 2 = 336 → y = 100 + 16 + 336
    expect(L.modules[2].shelves).toEqual([452]);
    // дві полиці: проміжок (688 - 32) / 3 = 218,67
    const [a, b] = L.modules[3].shelves;
    expect(a).toBeCloseTo(334.67, 2); // 116 + 218,67
    expect(b).toBeCloseTo(569.33, 2); // + 218,67 + 16
    expect(L.modules[3].fronts).toEqual([]);
  });
});

describe('moduleCount', () => {
  it.each([
    [{ type: 'doors', count: 5 }, 600, 2], // не більше 2 дверей
    [{ type: 'doors' }, 600, 1], // немає поля → типове
    [{ type: 'drawers', count: 0 }, 600, 1],
    [{ type: 'open', count: 0 }, 600, 0],
    [{ type: 'sink' }, 600, 2],
    [{ type: 'sink', count: 1 }, 599, 1], // для мийки count не враховується
  ])('%j, ширина %i → %i', (m, w, n) => expect(moduleCount(m, w)).toBe(n));
});

describe('worktopOf', () => {
  it('немає поля → типові виступи; від’ємні й нечислові → 0', () => {
    expect(worktopOf({})).toEqual({ front: 30, left: 0, right: 0 });
    expect(worktopOf({ worktop: { front: -5, left: 'x', right: 20 } })).toEqual({ front: 0, left: 0, right: 20 });
  });

  it('бічні виступи зсувають стільницю й габарит', () => {
    const L = computeLayout(
      kitchen([{ width: 600, type: 'doors', count: 1 }], { worktop: { front: 30, left: 10, right: 20 } }),
    );
    expect(L.worktop).toMatchObject({ x: -10, w: 630 }); // 600 + 10 + 20
    expect(L.bounds.W).toBe(630);
  });
});

describe('computeLayout — повідомлення', () => {
  const one = (m, fields) => computeLayout(kitchen([m], fields));

  it('замалий корпус', () => {
    expect(keys(one({ width: 600, type: 'doors', count: 1 }, { H: 200 }).errs)).toEqual(['check.kitchenTooSmall']);
  });

  it('вузький модуль — помилка', () => {
    const L = one({ width: 100, type: 'open', count: 0 });
    expect(L.errs).toEqual([
      { key: 'check.moduleNarrow', params: { name: { key: 'module.name', params: { n: 1 } }, w: 100 } },
    ]);
  });

  it('широкі двері: 800 - 2*3 = 794 > 600', () => {
    expect(one({ width: 800, type: 'doors', count: 1 }).warns).toContainEqual(
      expect.objectContaining({ key: 'check.doorWide', params: expect.objectContaining({ w: 794 }) }),
    );
  });

  it('вузька мийка', () => {
    expect(keys(one({ width: 400, type: 'sink' }).warns)).toContain('check.sinkNarrow');
  });

  it('прогин полиці: 900 - 2*16 = 868 > 800', () => {
    expect(one({ width: 900, type: 'open', count: 2 }).warns).toContainEqual(
      expect.objectContaining({ key: 'check.shelfSag', params: expect.objectContaining({ w: 868 }) }),
    );
  });

  it('мала шухляда: (500 - 7*3) / 6 = 79,8', () => {
    expect(drawerFront(500, 6)).toBeCloseTo(79.83, 2);
    expect(keys(one({ width: 600, type: 'drawers', count: 6 }, { H: 500 }).warns)).toContain('check.drawerSmall');
  });

  it('стільниця довша за 3000 → стик; глибша за 600', () => {
    const L = computeLayout(
      kitchen(
        Array.from({ length: 4 }, () => ({ width: 800, type: 'doors', count: 2 })),
        { D: 600 },
      ),
    );
    expect(L.warns).toContainEqual({ key: 'check.worktopJoin', params: { len: 3200, max: 3000 } }); // 4 * 800
    expect(L.warns).toContainEqual({ key: 'check.worktopDeep', params: { d: 630, max: 600 } }); // 600 + 30
  });

  it('висота робочої поверхні поза 850…950: 200 + 720 + 38 = 958', () => {
    expect(one({ width: 600, type: 'doors', count: 1 }, { legs: 200 }).warns).toContainEqual({
      key: 'check.counterHeight',
      params: { h: 958, min: 850, max: 950 },
    });
  });
});

describe('ніжки', () => {
  const one = (m, fields) => computeLayout(kitchen([m], fields));
  // Ніжка 40, відступ 40 від боків: крайні ряди на x + 40 і x + w - 80, відстань між ними w - 120.
  // Крок між рядами не більше 700 → третій ряд з'являється, коли w - 120 > 700, тобто з w > 820.
  it.each([
    [600, [40, 520]], // 600 - 80
    [820, [40, 740]], // 820 - 120 = 700 — ще два ряди
    [900, [40, 430, 820]], // 780 / 2 = 390
    [1600, [40, 533.33, 1026.67, 1520]], // 1480 > 2*700 → 3 проміжки по 493,33
  ])('модуль %i → ряди %j', (w, xs) => {
    legColumns(0, w).forEach((x, k) => expect(x).toBeCloseTo(xs[k], 2));
    expect(legColumns(0, w)).toHaveLength(xs.length);
  });

  it('ряди зсунуті на x модуля', () => {
    expect(legColumns(600, 600)).toEqual([640, 1120]); // 600 + 40, 600 + 600 - 80
  });

  it('у модулях — ряди за шириною; без ніжок — порожньо', () => {
    const s = kitchen([
      { width: 600, type: 'doors', count: 1 },
      { width: 900, type: 'doors', count: 2 },
    ]);
    expect(computeLayout(s).modules.map(m => m.legs)).toEqual([
      [40, 520],
      [640, 1030, 1420], // 600 + 40; 600 + 900 - 80; посередині
    ]);
    expect(computeLayout({ ...s, legs: 0 }).modules.map(m => m.legs)).toEqual([[], []]);
  });

  it('нижче за 80 мм — попередження; 80 і 0 (без ніжок) — ні', () => {
    const doors = { width: 600, type: 'doors', count: 1 };
    expect(one(doors, { legs: 60, H: 760 }).warns).toContainEqual({
      key: 'check.legsLow',
      params: { h: 60, min: 80 },
    });
    expect(keys(one(doors, { legs: 80 }).warns)).not.toContain('check.legsLow');
    expect(keys(one(doors, { legs: 0, H: 820 }).warns)).not.toContain('check.legsLow');
  });
});

describe('computeLayout — посудомийка', () => {
  const doors = { width: 600, type: 'doors', count: 1 };
  const dw = width => ({ width, type: 'dishwasher' });

  it('ніша між модулями: один фасад 450 - 2*3 × 720 - 2*3, без полиць, ніжок і боковин', () => {
    const L = computeLayout(kitchen([doors, dw(450), doors]));
    const m = L.modules[1];
    expect(m.fronts).toEqual([{ key: 'part.dishwasherFront', x: 603, y: 103, w: 444, h: 714 }]); // 600 + 3, 100 + 3
    expect(m.shelves).toEqual([]);
    expect(m.legs).toEqual([]);
    expect(m.endSides).toEqual([]);
    expect(L.W).toBe(1650); // 600 + 450 + 600
    expect(L.plinth).toEqual({ x: 0, w: 1650 });
  });

  it('ніша останньою: боковина справа назовні, цоколь до неї', () => {
    const L = computeLayout(kitchen([doors, dw(450)]));
    expect(L.modules[1].endSides).toEqual([1050]); // 600 + 450
    expect(L.modules[1].niche).toEqual({ x: 600, w: 450 });
    expect(L.W).toBe(1066); // 600 + 450 + 16
    expect(L.plinth).toEqual({ x: 0, w: 1050 });
  });

  it('ніша першою: боковина зліва, ніша й наступні модулі зсунуті на 16', () => {
    const L = computeLayout(kitchen([dw(600), doors]));
    expect(L.modules[0].endSides).toEqual([0]);
    expect(L.modules[0].fronts[0].x).toBe(19); // 16 + 3
    expect(L.modules[1].x).toBe(616); // 16 + 600
    expect(L.W).toBe(1216); // 16 + 600 + 600
    expect(L.plinth).toEqual({ x: 16, w: 1200 });
  });

  it('єдиний модуль-ніша: боковини з обох боків', () => {
    const L = computeLayout(kitchen([dw(600)]));
    expect(L.modules[0].endSides).toEqual([0, 616]); // 16 + 600
    expect(L.W).toBe(632); // 600 + 2*16
    expect(L.plinth).toEqual({ x: 16, w: 600 });
  });

  it('перша без попередження, кожна наступна — з попередженням', () => {
    const repeats = mods => computeLayout(kitchen(mods)).warns.filter(w => w.key === 'check.dishwasherRepeat');
    expect(repeats([doors, dw(600)])).toEqual([]);
    expect(repeats([dw(600), doors, dw(450), dw(450)]).map(w => w.params.name.params.n)).toEqual([3, 4]);
  });
});

describe('computeLayout — шухляди на напрямних', () => {
  it('мілкий корпус: шухляда 280 - 50 = 230 → 200 (ряд) < 250; вузький модуль: фасад 200 - 2*3 = 194 < 200', () => {
    const L = computeLayout(
      kitchen(
        [
          { width: 600, type: 'drawers', count: 3 },
          { width: 200, type: 'drawers', count: 3 },
        ],
        { D: 280 },
      ),
    );
    expect(keys(L.warns)).toEqual(expect.arrayContaining(['check.drawerShallow', 'check.drawerNarrow']));
  });
});
