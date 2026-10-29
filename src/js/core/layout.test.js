import { describe, it, expect } from 'vitest';
import { T } from '../config/constants.js';
import { computeLayout, drawerFront } from './layout.js';
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
