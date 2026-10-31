import { describe, it, expect } from 'vitest';
import { T } from '../config/constants.js';
import { carcass, computeLayout, drawerFront } from './layout.js';
import { preset, project, keys } from './test-fixtures.js';

describe('drawerFront', () => {
  it('віднімає зазори між фасадами', () => {
    expect(drawerFront(600, 3)).toBe(196); // (600 - 4*3) / 3
  });
});

describe('computeLayout — пресет «Шафа 3 секції»', () => {
  const L = computeLayout(preset('wardrobe'));

  it('рахує внутрішні розміри', () => {
    expect(L.innerW).toBe(1800 - 4 * T); // 2 боковини + 2 перегородки
    expect(L.y0).toBe(80 + T);
    expect(L.yTop).toBe(2400 - T);
    expect(L.Hin).toBe(2288);
  });

  it('ділить залишок ширини між «авто»-секціями', () => {
    expect(L.secs.map(c => c.w)).toEqual([568, 600, 568]);
    expect(L.secs.map(c => c.x)).toEqual([T, T + 568 + T, T + 568 + T + 600 + T]);
  });

  it('ділить залишок висоти між «авто»-зонами з урахуванням полиць між зонами', () => {
    expect(L.secs[0].zones.map(z => z.h)).toEqual([400, 928, 928]);
    expect(L.secs[1].zones.map(z => z.h)).toEqual([1672, 600]);
    expect(L.secs[2].zones.map(z => z.h)).toEqual([400, 1872]);
  });

  it('розставляє зони зверху вниз', () => {
    const [z1, z2] = L.secs[1].zones;
    expect(z1.top).toBe(L.yTop);
    expect(z1.bottom).toBe(L.yTop - 1672);
    expect(z2.top).toBe(z1.bottom - T);
    expect(z2.bottom).toBe(L.y0);
  });

  it('не має помилок і попереджень', () => {
    expect(L.errs).toEqual([]);
    expect(L.warns).toEqual([]);
  });
});

describe('computeLayout — повідомлення', () => {
  it('повертає {key, params} без готового тексту', () => {
    const L = computeLayout(project([{ width: 'auto', zones: [{ type: 'rod', height: 'auto' }] }], { W: 1500 }));
    const msg = L.warns.find(m => m.key === 'check.wideSection');
    expect(msg).toEqual({
      key: 'check.wideSection',
      params: { name: { key: 'section.name', params: { n: 1 } }, w: 1468 },
    });
  });

  it('замалі габарити', () => {
    expect(keys(computeLayout(preset('tumba')).errs)).toEqual([]);
    const s = preset('tumba');
    s.W = 200;
    expect(keys(computeLayout(s).errs)).toContain('check.tooSmall');
  });

  it('фіксовані ширини не вміщаються', () => {
    const s = preset('wardrobe');
    s.sections[0].width = 1200;
    const err = computeLayout(s).errs.find(m => m.key === 'check.widthsOverflow');
    expect(err.params.auto).toBe(-64);
  });

  it('усі ширини фіксовані, але сума не збігається', () => {
    const s = project([
      { width: 400, zones: [{ type: 'empty', height: 'auto' }] },
      { width: 400, zones: [{ type: 'empty', height: 'auto' }] },
    ]);
    expect(keys(computeLayout(s).errs)).toContain('check.widthsMismatch');
  });

  it('усі висоти фіксовані, але сума не збігається', () => {
    const s = project([{ width: 'auto', zones: [{ type: 'empty', height: 500 }] }]);
    expect(keys(computeLayout(s).errs)).toContain('check.heightsMismatch');
  });

  it('фіксовані висоти не вміщаються', () => {
    // доступно 1872 мм (H 2000 − цоколь − 2 плити − полиця між зонами), на «авто» лишається 22 < 60
    const s = project([
      {
        width: 'auto',
        zones: [
          { type: 'empty', height: 1850 },
          { type: 'empty', height: 'auto' },
        ],
      },
    ]);
    expect(keys(computeLayout(s).errs)).toContain('check.heightsOverflow');
  });

  it('вузька та широка секції', () => {
    const narrow = project([
      { width: 200, zones: [{ type: 'empty', height: 'auto' }] },
      { width: 'auto', zones: [{ type: 'empty', height: 'auto' }] },
    ]);
    expect(keys(computeLayout(narrow).warns)).toContain('check.narrowSection');
    const wide = project([{ width: 'auto', zones: [{ type: 'empty', height: 'auto' }] }], { W: 1200 });
    expect(keys(computeLayout(wide).warns)).toContain('check.wideSection');
  });

  it('низька зона під штангу', () => {
    const s = project([
      {
        width: 'auto',
        zones: [
          { type: 'rod', height: 700 },
          { type: 'empty', height: 'auto' },
        ],
      },
    ]);
    expect(keys(computeLayout(s).warns)).toContain('check.rodLow');
  });

  it('ящики: замалі, завеликі, зависоко', () => {
    const small = project([{ width: 'auto', zones: [{ type: 'drawers', count: 10, height: 'auto' }] }], { H: 900 });
    expect(keys(computeLayout(small).warns)).toContain('check.drawerSmall');
    const large = project([{ width: 'auto', zones: [{ type: 'drawers', count: 1, height: 'auto' }] }], { H: 900 });
    expect(keys(computeLayout(large).warns)).toContain('check.drawerLarge');
    const high = project([{ width: 'auto', zones: [{ type: 'drawers', count: 8, height: 'auto' }] }]);
    expect(keys(computeLayout(high).warns)).toContain('check.drawersHigh');
  });

  it('затісно між полицями', () => {
    const s = project([{ width: 'auto', zones: [{ type: 'shelves', count: 15, height: 'auto' }] }]);
    expect(keys(computeLayout(s).warns)).toContain('check.shelvesTight');
  });

  it('кількість у зоні не менша за 1', () => {
    const s = project([{ width: 'auto', zones: [{ type: 'shelves', count: 0, height: 'auto' }] }]);
    expect(computeLayout(s).secs[0].zones[0].cnt).toBe(1);
  });
});

describe('carcass — кришка', () => {
  const s = { W: 1800, H: 2400 };

  it('за замовчуванням (поля немає, старі файли) — між боковинами, одинарна', () => {
    // боковини на всю висоту 2400; кришка 1800 - 2*16 = 1768, починається після лівої боковини
    // задня стінка 2400 - 4 (по 2 мм від країв); глибина кришки = D
    expect(carcass({ ...s, D: 600 })).toEqual({
      mount: 'between',
      double: false,
      overhang: { back: 0, front: 0, left: 0, right: 0 },
      topT: 16,
      topQ: 1,
      sideH: 2400,
      topW: 1768,
      topX: 16,
      topD: 600,
      topZ: 0,
      backH: 2396,
    });
  });

  it('над боковинами', () => {
    // кришка на всю ширину 1800 від x = 0; боковини 2400 - 16 = 2384
    expect(carcass({ ...s, top: { mount: 'over' } })).toMatchObject({ sideH: 2384, topW: 1800, topX: 0 });
  });

  it('потовщена між боковинами — товщина 2 × 16, дві плити, боковини не змінюються', () => {
    expect(carcass({ ...s, top: { double: true } })).toMatchObject({ topT: 32, topQ: 2, sideH: 2400, topW: 1768 });
  });

  it('потовщена над боковинами — боковини коротші на 2 × 16', () => {
    // 2400 - 32 = 2368
    expect(carcass({ ...s, top: { mount: 'over', double: true } })).toMatchObject({
      topT: 32,
      sideH: 2368,
      topW: 1800,
    });
  });

  it('невідомі значення — як за замовчуванням', () => {
    expect(carcass({ ...s, top: { mount: 'foo', double: 'yes' } })).toMatchObject({ mount: 'between', double: false });
    expect(carcass({ ...s, top: 'over' }).mount).toBe('between');
  });

  describe('виступи кришки', () => {
    const over = overhang => carcass({ ...s, D: 600, top: { mount: 'over', overhang } });

    it('над боковинами: кришка ширша й глибша на виступи і зсунута ліворуч / назад', () => {
      const c = over({ back: 10, front: 20, left: 30, right: 40 });
      expect(c.overhang).toEqual({ back: 10, front: 20, left: 30, right: 40 });
      expect(c.topW).toBe(1870); // 1800 + 30 + 40
      expect(c.topX).toBe(-30);
      expect(c.topD).toBe(630); // 600 + 10 + 20
      expect(c.topZ).toBe(-10);
      expect(c.sideH).toBe(2384); // боковини не змінюються
    });

    it('виступ ззаду — задня стінка закінчується під кришкою', () => {
      expect(over({ back: 10 }).backH).toBe(2380); // 2400 - 16 - 4
      expect(carcass({ ...s, top: { mount: 'over', double: true, overhang: { back: 5 } } }).backH).toBe(2364); // 2400 - 32 - 4
    });

    it('без виступу ззаду задня стінка на всю висоту, навіть з іншими виступами', () => {
      expect(over({ front: 20, left: 30 }).backH).toBe(2396); // 2400 - 4
    });

    it('між боковинами виступи ігноруються', () => {
      const c = carcass({ ...s, D: 600, top: { mount: 'between', overhang: { back: 10, front: 20, left: 30 } } });
      expect(c.overhang).toEqual({ back: 0, front: 0, left: 0, right: 0 });
      expect(c).toMatchObject({ topW: 1768, topX: 16, topD: 600, topZ: 0, backH: 2396 });
    });

    it("від'ємні, нечислові й відсутні значення → 0", () => {
      expect(over({ back: -5, front: 'abc', left: null }).overhang).toEqual({ back: 0, front: 0, left: 0, right: 0 });
      expect(over('10').overhang).toEqual({ back: 0, front: 0, left: 0, right: 0 });
      expect(over({ front: '25' }).overhang.front).toBe(25);
    });
  });

  it('кріплення не змінює внутрішній простір', () => {
    const a = computeLayout(preset('wardrobe'));
    const b = computeLayout({ ...preset('wardrobe'), top: { mount: 'over' } });
    expect(b.Hin).toBe(a.Hin);
    expect(b.secs.map(c => c.w)).toEqual(a.secs.map(c => c.w));
  });

  it('потовщена кришка забирає 16 мм внутрішньої висоти', () => {
    const L = computeLayout({ ...preset('wardrobe'), top: { double: true } });
    expect(L.yTop).toBe(2368); // 2400 - 2*16
    expect(L.Hin).toBe(2272); // 2368 - (80 + 16)
    expect(L.secs[0].zones[0].top).toBe(2368);
  });
});
