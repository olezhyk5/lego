import { describe, it, expect } from 'vitest';
import { T } from '../../../config/constants.js';
import { MATERIALS } from '../../../config/materials.js';
import { computeLayout } from './layout.js';
import { modelGeometry } from './geometry.js';
import { partsList } from './parts.js';
import { preset, project, expectGeometryMatchesParts } from '../../test-fixtures.js';

const geomOf = s => modelGeometry(s, computeLayout(s));
const byKey = (G, key) => G.boxes.filter(b => b.key === key);
const at = ({ x, y, z, w, h, d }) => ({ x, y, z, w, h, d });

// Пресет «Шафа 3 секції»: W 1800, H 2400, D 600, цоколь 80, T 16.
// Внутрішня висота: y0 = 80 + 16 = 96, верх 2400 - 16 = 2384, Hin = 2288.
// Ширини: (1800 - 2*16 - 2*16 - 600) / 2 = 568 → секції x = 16, 600, 1216.
describe('modelGeometry — пресет «Шафа 3 секції»', () => {
  const G = geomOf(preset('wardrobe'));

  it('корпус', () => {
    expect(byKey(G, 'part.side').map(at)).toEqual([
      { x: 0, y: 0, z: 0, w: 16, h: 2400, d: 600 },
      { x: 1784, y: 0, z: 0, w: 16, h: 2400, d: 600 }, // 1800 - 16
    ]);
    expect(byKey(G, 'part.top').map(at)).toEqual([{ x: 16, y: 2384, z: 0, w: 1768, h: 16, d: 600 }]);
    expect(byKey(G, 'part.bottom').map(at)).toEqual([{ x: 16, y: 80, z: 0, w: 1768, h: 16, d: 600 }]);
    // цоколь на 30 мм глибше від фасаду: 600 - 16 - 30
    expect(byKey(G, 'part.plinth').map(at)).toEqual([{ x: 16, y: 0, z: 554, w: 1768, h: 80, d: 16 }]);
    // задня стінка за корпусом з відступом 2 мм: 1800 - 4 = 1796, висота 2400 - 4 = 2396, товщина ДВП 3
    expect(byKey(G, 'part.back').map(at)).toEqual([{ x: 2, y: 2, z: -3, w: 1796, h: 2396, d: 3 }]);
    expect(byKey(G, 'part.back')[0]).toMatchObject({ kind: 'panel', mat: 'hardboard' });
  });

  it('перегородки між секціями', () => {
    expect(byKey(G, 'part.divider').map(at)).toEqual([
      { x: 584, y: 96, z: 0, w: 16, h: 2288, d: 600 }, // 16 + 568
      { x: 1200, y: 96, z: 0, w: 16, h: 2288, d: 600 }, // 600 + 600
    ]);
  });

  it('полиця між зонами — під нижнім краєм зони', () => {
    // секція 1: зона «порожньо» 400 від верху 2384 → низ 1984, полиця 1984 - 16
    expect(byKey(G, 'part.zoneShelf')[0]).toEqual({
      key: 'part.zoneShelf',
      kind: 'panel',
      mat: 'chipboard',
      look: 'shelf',
      ...{ x: 16, y: 1968, z: 0, w: 568, h: 16, d: 600 },
    });
    expect(byKey(G, 'part.zoneShelf')).toHaveLength(4); // 2 + 1 + 1
  });

  it('полиці рівномірно в зоні', () => {
    // секція 2, зона полиць: 2288 - 16 - 600 = 1672, низ 2384 - 1672 = 712
    // проміжок (1672 - 3*16) / 4 = 406 → y = 712 + 406, + 406 + 16, + 2*(406 + 16)
    expect(byKey(G, 'part.shelf').map(b => b.y)).toEqual([1118, 1540, 1962]);
    expect(at(byKey(G, 'part.shelf')[0])).toEqual({ x: 600, y: 1118, z: 0, w: 600, h: 16, d: 580 });
  });

  it('фасади ящиків і ручки', () => {
    // зона ящиків 600 від низу 96; фасад (600 - 4*3) / 3 = 196, крок 196 + 3; товщина — ДСП 16
    expect(byKey(G, 'part.drawerFront').map(at)).toEqual(
      [99, 298, 497].map(y => ({ x: 603, y, z: 584, w: 594, h: 196, d: 16 })), // z = 600 - 16
    );
    const handles = byKey(G, 'part.handle');
    expect(handles).toHaveLength(3);
    expect(handles[0].kind).toBe('hardware');
    // ширина min(600*0.35, 180) = 180, по центру секції: 600 + 300 - 90
    expect(handles[0]).toMatchObject({ x: 810, z: 600, w: 180, h: 12, d: 18 });
    expect(handles[0].y).toBeCloseTo(220.52); // 99 + 196*0.62
  });

  it('штанги на 60 мм нижче верху зони', () => {
    // секція 1: (2288 - 2*16 - 400) / 2 = 928; верх зон 2384 - 400 - 16 = 1968 і 1968 - 928 - 16 = 1024
    // секція 3: одна штанга, верх зони теж 1968
    expect(G.rods).toEqual([
      { key: 'part.rod', look: 'rod', x: 16, y: 1908, z: 300, len: 568, r: 12 },
      { key: 'part.rod', look: 'rod', x: 16, y: 964, z: 300, len: 568, r: 12 },
      { key: 'part.rod', look: 'rod', x: 1216, y: 1908, z: 300, len: 568, r: 12 },
    ]);
  });
});

describe('modelGeometry — відповідність специфікації', () => {
  // пресети перевіряє core/registry.test.js; тут — крайові випадки
  const OVERHANG = { back: 10, front: 20, left: 30, right: 40 };
  it.each([
    ['кришка над боковинами з виступами', { ...preset('wardrobe'), top: { mount: 'over', overhang: OVERHANG } }],
    ['потовщена кришка між боковинами', { ...preset('wardrobe'), top: { mount: 'between', double: true } }],
    ['потовщена кришка над боковинами', { ...preset('komod'), top: { mount: 'over', double: true } }],
    ['без цоколя', { ...preset('penal'), plinth: 0 }],
    [
      'одна секція, зони без «авто»',
      project([{ width: 'auto', zones: [{ type: 'drawers', count: 4, height: 1904 }] }]),
    ],
    [
      'дробові ширини',
      project([{ width: 'auto', zones: [{ type: 'shelves', count: 3, height: 'auto' }] }], { W: 1001 }),
    ],
  ])('%s', (_, s) => {
    const L = computeLayout(s);
    expectGeometryMatchesParts(modelGeometry(s, L), partsList(s, L));
  });

  it('штанги — по одній на зону зі штангою', () => {
    const s = preset('wardrobe');
    const L = computeLayout(s);
    const rods = partsList(s, L)
      .items.filter(p => p.key === 'part.rod')
      .reduce((sum, p) => sum + p.q, 0);
    expect(modelGeometry(s, L).rods.length).toBe(rods);
  });

  it('потовщена кришка — дві плити по 16 мм одна на одній', () => {
    const G = geomOf({ ...preset('wardrobe'), top: { mount: 'between', double: true } });
    // нижня 2400 - 2*16 = 2368, верхня 2400 - 16 = 2384
    expect(byKey(G, 'part.top').map(at)).toEqual([
      { x: 16, y: 2368, z: 0, w: 1768, h: 16, d: 600 },
      { x: 16, y: 2384, z: 0, w: 1768, h: 16, d: 600 },
    ]);
  });
});

describe('modelGeometry — кришка над боковинами з виступами', () => {
  it('кришка зсунута на виступи зліва й ззаду, боковини під нею', () => {
    const G = geomOf({
      ...preset('wardrobe'),
      top: { mount: 'over', overhang: { back: 10, front: 20, left: 30, right: 40 } },
    });
    // 1800 + 30 + 40 = 1870; 600 + 10 + 20 = 630; y = 2400 - 16
    expect(byKey(G, 'part.top').map(at)).toEqual([{ x: -30, y: 2384, z: -10, w: 1870, h: 16, d: 630 }]);
    expect(byKey(G, 'part.side')[0].h).toBe(2384);
    // виступ ззаду → задня стінка по висоті боковин: 2384 - 4
    expect(byKey(G, 'part.back')[0].h).toBe(2380);
  });
});

describe('modelGeometry — умовні деталі', () => {
  it('без цоколя немає боксу цоколя', () => {
    expect(byKey(geomOf(preset('tumba')), 'part.plinth')).toEqual([]);
  });
});

describe('товщини', () => {
  it('T у розрахунку збігається з товщиною ДСП (товщина плит у 3D — з матеріалу)', () => {
    expect(T).toBe(MATERIALS.chipboard.t);
  });
});
