import { describe, it, expect } from 'vitest';
import { computeLayout } from './layout.js';
import { partsList, describe as describeModules } from './parts.js';
import { modelGeometry } from './geometry.js';
import { annotations } from './annotations.js';
import { placements, placeRect, placePoint, placeDir, placedBuilder } from './walls.js';
import { geometryBuilder } from '../../common/geometry-builder.js';
import { kitchen, kitchenPreset, keys, expectGeometryMatchesParts } from '../../test-fixtures.js';

const doors = (width = 600) => ({ width, type: 'doors', count: 1 });
const blind = { type: 'blind', width: 1100, filler: 70, count: 1 };
const lShape = { type: 'lShape', a: 900, b: 900, count: 1 };
const withCorner = (corner, modules = [doors()], fields = {}) =>
  kitchen([doors()], { walls: [{ corner, modules }], ...fields });
const panelOf = (P, key) => P.panels.filter(p => p.key === key);

describe('розміщення стін', () => {
  it('кожна наступна стіна починається в кінці попередньої, поворот на 90°', () => {
    expect(placements([1000, 800])).toEqual([
      { r: 0, ox: 0, oz: 0 },
      { r: 1, ox: 1000, oz: 0 },
    ]);
    expect(placements([1000, 800, 500])[2]).toEqual({ r: 2, ox: 1000, oz: 800 });
  });

  it('третя стіна довша за першу: усе зсувається, щоб лишитись у додатному x', () => {
    const p = placements([1000, 800, 1500]);
    expect(p.map(q => q.ox)).toEqual([500, 1500, 1500]); // 1500 - 1000 = 500
    expect(p[2].ox - 1500).toBe(0); // кінець третьої стіни в x = 0
  });

  it('прямокутник: r = 1 міняє осі, r = 2 віддзеркалює', () => {
    const rect = { x: 100, z: 0, w: 50, d: 10 };
    expect(placeRect({ r: 0, ox: 5, oz: 7 }, rect)).toEqual({ x: 105, z: 7, w: 50, d: 10 });
    expect(placeRect({ r: 1, ox: 1000, oz: 0 }, rect)).toEqual({ x: 990, z: 100, w: 10, d: 50 }); // 1000 - 0 - 10
    expect(placeRect({ r: 2, ox: 1000, oz: 500 }, rect)).toEqual({ x: 850, z: 490, w: 50, d: 10 }); // 1000 - 100 - 50
  });

  it('точка й напрямок', () => {
    expect(placePoint({ r: 1, ox: 1000, oz: 0 }, [100, 5, 20])).toEqual([980, 5, 100]);
    expect(placeDir({ r: 1, ox: 1000, oz: 0 }, [1, 0, 0])).toEqual([-0, 0, 1]);
  });

  it('циліндр на стіні зберігає початок і напрям осі', () => {
    const root = geometryBuilder();
    const G = placedBuilder(root, { r: 1, ox: 1000, oz: 0 });
    G.rod('part.sink', 'steel', 100, 5, 20, 200, 9, 'z');
    G.rod('part.sink', 'steel', 100, 5, 20, 200, 9, 'x');
    G.rod('part.sink', 'steel', 100, 5, 20, 200, 9, 'y');
    const { rods } = root.result();
    expect(rods[0]).toMatchObject({ x: 780, z: 100, len: 200 }); // 1000 - 20 - 200; вісь x — типова
    expect(rods[1]).toMatchObject({ x: 980, z: 100, len: 200, axis: 'z' });
    expect(rods[2]).toMatchObject({ x: 980, z: 100, len: 200, axis: 'y' });
  });
});

describe('глухий кут', () => {
  const s = withCorner(blind);
  const L = computeLayout(s);
  const [a, b] = L.walls;

  it('стоїть на кінці першої стіни; друга починається за фасадом і планкою', () => {
    expect(a.corner).toMatchObject({ x: 600, w: 1100, len: 1100 });
    expect(a.end).toBe(1700); // 600 + 1100
    expect(b.start).toBe(646); // 560 + 16 + 70
    expect(b.modules[0].x).toBe(646);
    expect(b.end).toBe(1246);
  });

  it('двері 1100 - 560 - 16 - 70 - 2*3 = 448', () => {
    expect(a.corner.fronts).toEqual([{ key: 'part.door', x: 603, y: 103, w: 448, h: 714 }]);
    expect(L.errs).toEqual([]);
  });

  it('стільниця наступної стіни впирається в стільницю попередньої', () => {
    expect(a.worktops).toEqual([{ x: 0, w: 1700, d: 590, t: 38 }]);
    expect(b.worktops).toEqual([{ x: 590, w: 656, d: 590, t: 38 }]); // 1246 - 590
  });

  it('цоколі сходяться у внутрішньому куті', () => {
    expect(a.plinths).toEqual([{ x: 0, w: 1206, depth: 560 }]); // 1700 - (560 - 50) + 16
    expect(b.plinths).toEqual([{ x: 510, w: 736, depth: 560 }]); // від 560 - 50 до 1246
  });

  it('габарити: перша стіна + глибина другої', () => {
    expect(L.bounds).toMatchObject({ W: 1700, D: 1246 });
  });

  it('специфікація: корпус як у звичайного модуля, дві доборні планки', () => {
    const P = partsList(s, L);
    expect(panelOf(P, 'part.filler')).toEqual([
      { key: 'part.filler', mat: 'chipboard', a: 86, b: 720, q: 1 }, // 70 + 16
      { key: 'part.filler', mat: 'chipboard', a: 70, b: 720, q: 1 },
    ]);
    expect(panelOf(P, 'part.bottom')).toContainEqual({ key: 'part.bottom', mat: 'chipboard', a: 1068, b: 560, q: 1 }); // 1100 - 2*16
    expect(panelOf(P, 'part.door')).toContainEqual({ key: 'part.door', mat: 'chipboard', a: 448, b: 714, q: 1 });
    expectGeometryMatchesParts(modelGeometry(s, L), P);
  });

  it('замалий корпус — помилка; без сусідньої стіни — попередження', () => {
    const small = computeLayout(withCorner({ ...blind, width: 700 }));
    expect(keys(small.errs)).toContain('check.cornerNarrow'); // 700 - 560 - 16 - 70 - 6 = 48
    expect(small.errs[0].params.w).toBe(48);
    expect(keys(computeLayout(withCorner(blind, [])).warns)).toContain('check.blindNoNeighbour');
  });

  it('посудомийка за кутом — без додаткової боковини', () => {
    const L2 = computeLayout(withCorner(blind, [{ width: 600, type: 'dishwasher' }]));
    expect(L2.walls[1].modules[0].endSides).toEqual([1246]); // лише вільний правий край: 646 + 600
    const L3 = computeLayout(
      kitchen([{ width: 600, type: 'dishwasher' }], { walls: [{ corner: blind, modules: [doors()] }] }),
    );
    expect(L3.walls[0].modules[0].endSides).toEqual([0]); // лише вільний лівий край
  });
});

describe('Г-подібний кут', () => {
  const s = withCorner(lShape);
  const L = computeLayout(s);
  const [a, b] = L.walls;

  it('займає обидві стіни', () => {
    expect(a.end).toBe(1500); // 600 + 900
    expect(b.start).toBe(900);
    expect(b.modules[0].x).toBe(900);
  });

  it('двері-книжка: 900 - 560 - 16 - 6 = 318 і 900 - 560 - 6 = 334', () => {
    expect(a.corner.doors.map(d => [d.w, d.d])).toEqual([
      [318, 16],
      [16, 334],
    ]);
    expect(L.errs).toEqual([]);
  });

  it('специфікація: заготовки дна й полиці 884 × 884, чотири царги, дві задні стінки', () => {
    const P = partsList(s, L);
    expect(panelOf(P, 'part.bottom')).toContainEqual({ key: 'part.bottom', mat: 'chipboard', a: 884, b: 884, q: 1 });
    expect(panelOf(P, 'part.shelf')).toContainEqual({ key: 'part.shelf', mat: 'chipboard', a: 884, b: 884, q: 1 });
    const rails = panelOf(P, 'part.rail').filter(p => p.a !== 568);
    expect(rails.map(p => p.a).sort((x, y) => x - y)).toEqual([324, 424, 784, 884]);
    expect(panelOf(P, 'part.back')).toContainEqual({ key: 'part.back', mat: 'hardboard', a: 716, b: 896, q: 2 });
    expectGeometryMatchesParts(modelGeometry(s, L), P);
  });

  it('фурнітура: одна ручка на дві дверки, по 2 петлі, 6 ніжок', () => {
    const only = withCorner(lShape, []);
    const P = partsList(only, computeLayout(only));
    expect(P.items.find(i => i.key === 'part.handle').q).toBe(2); // модуль першої стіни + кут
    expect(P.items.find(i => i.key === 'part.hinge').q).toBe(6); // 2 + 2*2
    expect(P.items.find(i => i.key === 'part.leg').q).toBe(10); // 4 + 6
  });

  it('дно з вирізом у внутрішньому куті, у координатах моделі', () => {
    const bottom = modelGeometry(s, L).boxes.find(p => p.key === 'part.bottom' && p.notch);
    expect(bottom).toMatchObject({ x: 616, z: 0, w: 884, d: 884 }); // 600 + 16
    expect(bottom.notch).toEqual({ x: 616, z: 560, w: 324, d: 324 }); // 884 - 560
  });

  it('стільниця другої стіни від краю першої', () => {
    expect(b.worktops[0]).toMatchObject({ x: 590, w: 910 }); // 1500 - 590
  });

  it('без модулів на другій стіні цоколь і стільниця доходять до кінця плеча', () => {
    const L2 = computeLayout(withCorner(lShape, []));
    expect(L2.walls[1].worktops).toEqual([{ x: 590, w: 310, d: 590, t: 38 }]); // 900 - 590
    expect(L2.walls[1].plinths).toEqual([{ x: 510, w: 390, depth: 560 }]); // 900 - 510
    expect(L2.errs).toEqual([]);
  });

  it('замале плече — помилка', () => {
    expect(keys(computeLayout(withCorner({ ...lShape, b: 650 })).errs)).toContain('check.cornerNarrow');
  });
});

describe('пресети кутів', () => {
  it('Г-подібна кухня: габарити й верхні другої стіни за верхніми першої', () => {
    const L = computeLayout(kitchenPreset('cornerL'));
    expect(L.walls[0].end).toBe(2300); // 600 + 800 + 900
    expect(L.walls[1].end).toBe(2100); // 900 + 600 + 600
    expect(L.bounds).toMatchObject({ W: 2300, D: 2100 });
    expect(L.walls[1].uppers[0].x).toBe(336); // 320 + 16
  });

  it('П-подібна кухня: третя стіна розвернута й лишається в межах моделі', () => {
    const s = kitchenPreset('cornerU');
    const L = computeLayout(s);
    expect(L.walls.map(w => w.place.r)).toEqual([0, 1, 2]);
    expect(L.walls[2].place).toMatchObject({ ox: 2300, oz: 2346 }); // 600 + 600 + 1100; 646 + 800 + 900
    expect(L.bounds.D).toBe(2346);
    modelGeometry(s, L).boxes.forEach(b => {
      expect(b.x).toBeGreaterThanOrEqual(-4);
      expect(b.x + b.w).toBeLessThanOrEqual(L.bounds.W + 4);
    });
    expect(describeModules(s, L).filter(r => r.key === 'describe.corner')).toHaveLength(2);
  });

  it('вибраний модуль другої стіни підсвічується на своєму місці', () => {
    const s = kitchenPreset('cornerL');
    const L = computeLayout(s);
    const A = annotations(s, L, { sel: 0, wall: 1, tier: 'base' });
    expect(A.highlight).toEqual({ x: 1738, y: 100, z: 900, w: 562, h: 720, d: 600 }); // 2300 - 562; 560 + 2
  });

  it('мийка на другій стіні: виріз у стільниці разом із нею повернутий', () => {
    const s = withCorner(lShape, [{ width: 800, type: 'sink' }]);
    const L = computeLayout(s);
    const top = modelGeometry(s, L).boxes.find(p => p.key === 'part.worktop' && p.holes);
    expect(top.holes).toEqual([{ x: 1040, z: 1000, w: 360, d: 600 }]); // 1500 - 100 - 360; 900 + 100
  });
});
