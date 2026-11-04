import { describe, it, expect } from 'vitest';
import { computeLayout, upperOf } from './layout.js';
import { partsList, describe as describeModules } from './parts.js';
import { modelGeometry } from './geometry.js';
import { kitchen, kitchenPreset, keys, expectGeometryMatchesParts } from '../../test-fixtures.js';
import { hingesFor } from './base-module.js';

const doors = (width = 600) => ({ width, type: 'doors', count: 1 });
const fridge = (over = {}) => ({ width: 600, type: 'fridge', nicheH: 1800, nicheD: 550, ...over });
const tall = zones => ({ width: 600, type: 'tall', zones });
const panelOf = (P, key) => P.panels.filter(p => p.key === key);

describe('upperOf', () => {
  it('немає поля → типові; нульовий відступ дозволений', () => {
    expect(upperOf({})).toEqual({ H: 720, D: 320, gap: 550 });
    expect(upperOf({ upper: { H: 600, D: 300, gap: 0 } })).toEqual({ H: 600, D: 300, gap: 0 });
    expect(upperOf({ upper: { H: 0, gap: -1 } })).toEqual({ H: 720, D: 320, gap: 550 });
  });
});

describe('лінія верху', () => {
  it('ніжки + корпус + стільниця + відступ + верхні', () => {
    expect(computeLayout(kitchen([doors()])).top).toBe(2128); // 100 + 720 + 38 + 550 + 720
    const up = { upper: { H: 900, D: 320, gap: 600 } };
    expect(computeLayout(kitchen([doors()], up)).top).toBe(2358); // 100 + 720 + 38 + 600 + 900
  });

  it('без верхніх і високих габарит не змінюється', () => {
    const L = computeLayout(kitchen([doors()]));
    expect(L.bounds).toEqual({ W: 600, H: 858, D: 590 }); // 100 + 720 + 38
  });
});

describe('верхні модулі', () => {
  it('стоять над стільницею, не змінюють нижній ряд', () => {
    const L = computeLayout(kitchen([doors(), doors()], { uppers: [doors(), { width: 300, type: 'open', count: 2 }] }));
    expect(L.W).toBe(1200);
    expect(L.uppers.map(m => [m.x, m.y0, m.h, m.depth])).toEqual([
      [0, 1408, 720, 320], // 100 + 720 + 38 + 550
      [600, 1408, 720, 320],
    ]);
    expect(L.bounds).toEqual({ W: 1200, H: 2128, D: 590 });
  });

  it('фасад дверей: 600 - 2*3, 720 - 2*3; ручка внизу', () => {
    const [m] = computeLayout(kitchen([doors()], { uppers: [doors()] })).uppers;
    expect(m.fronts).toEqual([{ key: 'part.door', x: 3, y: 1411, w: 594, h: 714, handleY: 1456 }]); // 1408 + 48
  });

  it('специфікація: корпус, двері, навіси; геометрія збігається', () => {
    const s = kitchen([doors()], { uppers: [doors()] });
    const L = computeLayout(s);
    const P = partsList(s, L);
    expect(panelOf(P, 'part.side')).toContainEqual({ key: 'part.side', mat: 'chipboard', a: 720, b: 320, q: 2 });
    expect(panelOf(P, 'part.top')).toEqual([{ key: 'part.top', mat: 'chipboard', a: 568, b: 320, q: 1 }]); // 600 - 2*16
    expect(panelOf(P, 'part.shelf')).toContainEqual({ key: 'part.shelf', mat: 'chipboard', a: 568, b: 300, q: 1 }); // 320 - 20
    expect(P.items.find(i => i.key === 'part.hanger').q).toBe(2);
    expectGeometryMatchesParts(modelGeometry(s, L), P);
  });

  it('проміжок займає місце, але без деталей', () => {
    const s = kitchen([doors(1200)], { uppers: [{ width: 600, type: 'gap' }, doors()] });
    const L = computeLayout(s);
    expect(L.uppers[1].x).toBe(600);
    const P = partsList(s, L);
    expect(P.items.find(i => i.key === 'part.hanger').q).toBe(2); // лише один корпус
    expect(describeModules(s, L).filter(r => r.key === 'describe.upper')).toHaveLength(1);
  });

  it('за кінець стіни — попередження', () => {
    const L = computeLayout(kitchen([doors()], { uppers: [doors(), doors(100)] }));
    expect(L.warns.find(w => w.key === 'check.upperOverflow').params.over).toBe(100); // 600 + 100 - 600
    expect(keys(L.errs)).toContain('check.moduleNarrow'); // ширина 100 менша за 150
  });
});

describe('пресет «Кухня з пеналом і холодильником»', () => {
  const s = kitchenPreset('full');
  const L = computeLayout(s);
  const wall = L.walls[0];

  it('ширина: холодильник 600 + 2*16 = 632', () => {
    expect(wall.modules.map(m => m.x)).toEqual([0, 632, 1232, 2032, 2632]);
    expect(L.W).toBe(3232); // 2632 + 600
    expect(L.bounds.H).toBe(2128);
  });

  it('стільниця лише між високими модулями', () => {
    expect(wall.worktops).toEqual([{ x: 632, w: 2000, d: 590, t: 38 }]); // 2632 - 632
  });

  it('верхні оминають холодильник і пенал', () => {
    expect(wall.uppers.map(m => m.x)).toEqual([632, 1232, 2032]);
    expect(L.warns.filter(w => w.key === 'check.upperOverflow')).toEqual([]);
  });

  it('цоколь: холодильник мілкіший — окрема планка', () => {
    expect(wall.plinths).toEqual([
      { x: 0, w: 632, depth: 550 },
      { x: 632, w: 2600, depth: 560 },
    ]);
  });

  it('геометрія = специфікація', () => {
    expectGeometryMatchesParts(modelGeometry(s, L), partsList(s, L));
  });
});

describe('пенал', () => {
  const zones = [
    { type: 'shelves', count: 3, height: 'auto' },
    { type: 'microwave', height: 400 },
    { type: 'oven', height: 600 },
    { type: 'drawers', count: 2, height: 'auto' },
  ];
  const s = kitchen([tall(zones)]);
  const L = computeLayout(s);
  const [m] = L.modules;

  it('висоти зон: авто (2028 - 2*16 - 3*16 - 1000) / 2 = 474', () => {
    expect(m.h).toBe(2028); // 2128 - 100
    expect(m.zones.map(z => [z.top, z.bottom])).toEqual([
      [2112, 1638], // 100 + 2028 - 16
      [1622, 1222],
      [1206, 606],
      [590, 116], // 100 + 16
    ]);
  });

  it('полиці між зонами', () => {
    expect(m.dividers).toEqual([1622, 1206, 590]); // низ зони - 16
  });

  it('фасади: двері до середини полиці; шухляди (493,5 - 3) / 2', () => {
    const door = m.fronts.find(f => f.key === 'part.door');
    expect(door).toMatchObject({ y: 1631.5, h: 493.5 }); // 1638 - 8 + 1,5; 2125 - 1631,5
    const dr = m.fronts.filter(f => f.key === 'part.drawerFront');
    expect(dr.map(f => [f.y, f.h])).toEqual([
      [103, 245.25],
      [351.25, 245.25], // 103 + 245,25 + 3
    ]);
  });

  it('техніка: без фасадів, позиція в специфікації з розміром ніші', () => {
    expect(m.appliances.map(a => a.key)).toEqual(['part.microwave', 'part.oven']);
    const P = partsList(s, L);
    expect(P.items.find(i => i.key === 'part.oven').size.params).toEqual({ w: 568, h: 600, d: 560 });
    expect(P.items.find(i => i.key === 'part.microwave').size.params).toEqual({ w: 568, h: 400, d: 560 });
    expect(L.warns.filter(w => w.key === 'check.applianceNiche')).toEqual([]);
  });

  it('специфікація: боковина на всю висоту, задня стінка, геометрія збігається', () => {
    const P = partsList(s, L);
    expect(panelOf(P, 'part.side')).toEqual([{ key: 'part.side', mat: 'chipboard', a: 2028, b: 560, q: 2 }]);
    expect(panelOf(P, 'part.zoneShelf')).toEqual([{ key: 'part.zoneShelf', mat: 'chipboard', a: 568, b: 560, q: 3 }]);
    expect(panelOf(P, 'part.back')).toEqual([{ key: 'part.back', mat: 'hardboard', a: 2024, b: 596, q: 1 }]);
    expectGeometryMatchesParts(modelGeometry(s, L), P);
  });

  it('вузька ніша під духовку — попередження', () => {
    const narrow = kitchen([{ ...tall([{ type: 'oven', height: 'auto' }]), width: 500 }]);
    expect(computeLayout(narrow).warns.find(w => w.key === 'check.applianceNiche').params).toMatchObject({
      w: 468, // 500 - 2*16
      minW: 560,
    });
  });

  it('сума зон без авто не збігається — помилка', () => {
    const L2 = computeLayout(kitchen([tall([{ type: 'empty', height: 1000 }])]));
    expect(L2.errs).toContainEqual(expect.objectContaining({ key: 'check.heightsMismatch' }));
    expect(L2.errs[0].params).toMatchObject({ sum: 1000, avail: 1996 }); // 2028 - 2*16
  });

  it('широкий пенал — двоє дверей на зону', () => {
    const L3 = computeLayout(kitchen([{ ...tall([{ type: 'empty', height: 'auto' }]), width: 800 }]));
    expect(L3.modules[0].fronts).toHaveLength(2);
  });
});

describe('hingesFor', () => {
  it.each([
    [714, 2],
    [1000, 2],
    [1001, 3],
    [1600, 3],
    [1601, 4],
  ])('двері %i → %i петель', (h, n) => expect(hingesFor(h)).toBe(n));

  it('високі двері в специфікації', () => {
    const s = kitchen([tall([{ type: 'empty', height: 'auto' }])]);
    expect(partsList(s, computeLayout(s)).items.find(i => i.key === 'part.hinge').q).toBe(4); // двері 2022
  });
});

describe('холодильник', () => {
  const layout = (m, fields) => computeLayout(kitchen([m], fields));

  it('типова висота: антресоль 2028 - 1832 - 16 = 180', () => {
    const [m] = layout(fridge()).modules;
    expect(m.w).toBe(632); // 600 + 2*16
    expect(m.h).toBe(2028);
    expect(m.antresolH).toBe(180);
    expect(m.yShelf).toBe(1916); // 100 + 16 + 1800
    expect(m.fronts.map(f => [f.key, f.y, f.h])).toEqual([
      ['part.freezerFront', 103, 650],
      ['part.fridgeFront', 756, 1166.5], // 1916 + 8 - 1,5 - 756
      ['part.door', 1925.5, 199.5], // 1916 + 8 + 1,5; 2125 - 1925,5
    ]);
  });

  it('малий відступ: без антресолі, фасад холодильника до верху', () => {
    const [m] = layout(fridge(), { upper: { H: 720, D: 320, gap: 400 } }).modules;
    expect(m.h).toBe(1878); // 100 + 720 + 38 + 400 + 720 - 100
    expect(m.antresolH).toBe(0); // 1878 - 1832 - 16 = 30 < 150
    expect(m.yShelf).toBeNull();
    expect(m.fronts).toHaveLength(2);
    expect(m.fronts[1].h).toBe(1219); // 100 + 1878 - 3 - 756
  });

  it('ніша вища за верх кухні: корпус виступає, попередження', () => {
    const L = layout(fridge({ nicheH: 2000 }));
    expect(L.modules[0].h).toBe(2032); // 2*16 + 2000
    expect(L.warns).toContainEqual(expect.objectContaining({ key: 'check.fridgeAboveTop' }));
    expect(L.warns.find(w => w.key === 'check.fridgeAboveTop').params).toMatchObject({ h: 2132, top: 2128 });
    expect(L.bounds.H).toBe(2132);
  });

  it('цоколь суцільний, якщо глибина ніші = глибина кухні', () => {
    const L = computeLayout(kitchen([doors(), fridge({ nicheD: 560 }), doors()]));
    expect(L.walls[0].plinths).toEqual([{ x: 0, w: 1832, depth: 560 }]); // 600 + 632 + 600
  });

  it('інша глибина: планка холодильника окремо', () => {
    const L = computeLayout(kitchen([doors(), fridge({ nicheD: 600 }), doors()]));
    expect(L.walls[0].plinths).toEqual([
      { x: 0, w: 600, depth: 560 },
      { x: 600, w: 632, depth: 600 },
      { x: 1232, w: 600, depth: 560 },
    ]);
  });

  it('специфікація: без задньої стінки, петлі лише на антресолі, техніка окремо', () => {
    const s = kitchen([fridge()]);
    const L = computeLayout(s);
    const P = partsList(s, L);
    expect(panelOf(P, 'part.back')).toEqual([]);
    expect(panelOf(P, 'part.side')).toEqual([{ key: 'part.side', mat: 'chipboard', a: 2028, b: 550, q: 2 }]);
    expect(P.items.find(i => i.key === 'part.hinge').q).toBe(2);
    expect(P.items.find(i => i.key === 'part.handle').q).toBe(3);
    expect(P.items.find(i => i.key === 'part.fridge').size.params).toEqual({ w: 600, h: 1800, d: 550 });
    expectGeometryMatchesParts(modelGeometry(s, L), P);
  });

  it('посудомийка поряд із високим модулем — без додаткової боковини', () => {
    const L = computeLayout(kitchen([fridge(), { width: 600, type: 'dishwasher' }, fridge()]));
    expect(L.modules[1].endSides).toEqual([]);
  });
});
