import { describe, it, expect } from 'vitest';
import { legRows, legCount, legsLowWarning, addLeg, addLegGeometry } from './legs.js';
import { geometryBuilder } from './geometry-builder.js';

describe('legRows', () => {
  it('обов’язкові ряди з кроком до 700 — без проміжних', () => {
    expect(legRows([0, 700])).toEqual([0, 700]);
    expect(legRows([0, 572, 1188, 1760])).toEqual([0, 572, 1188, 1760]);
  });

  it('проміжні ряди — рівномірно в кожному проміжку окремо', () => {
    expect(legRows([0, 701])).toEqual([0, 350.5, 701]); // 701 > 700 → 2 проміжки
    expect(legRows([0, 1500, 1800])).toEqual([0, 500, 1000, 1500, 1800]); // 1500 / 3 = 500; 300 — без змін
  });

  it('свій крок', () => expect(legRows([0, 900], 300)).toEqual([0, 300, 600, 900]));
  it('один ряд — як є', () => expect(legRows([10])).toEqual([10]));
});

describe('legCount і legsLowWarning', () => {
  it('по дві ніжки в ряду', () => expect(legCount([0, 500, 1000])).toBe(6));

  it.each([
    [60, { key: 'check.legsLow', params: { h: 60, min: 80 } }],
    [79.6, { key: 'check.legsLow', params: { h: 80, min: 80 } }], // показуємо округлене
    [80, null],
    [0, null], // без ніжок
  ])('висота %d → %j', (h, warn) => expect(legsLowWarning(h)).toEqual(warn));
});

describe('addLeg', () => {
  // h 100: пластина 4, п'ята 12, між ними 84 → корпус 84 * 0.6 = 50.4 (верх 50.4 * 0.3 = 15.12), гвинт 33.6
  const G = geometryBuilder();
  addLeg(G, 0, 40, 100);
  const { boxes, rods } = G.result();

  it('пластина під дном — бокс 40 × 40 угорі ніжки', () => {
    expect(boxes.map(({ kind, key, x, y, z, w, h, d }) => [kind, key, x, y, z, w, h, d])).toEqual([
      ['hardware', 'part.leg', 0, 96, 40, 40, 4, 40], // 100 - 4
    ]);
  });

  it('корпус, гвинт і п’ята — вертикальні циліндри по осі ніжки (20, 60), без щілин від підлоги до пластини', () => {
    const at = ({ key, look, x, y, z, len, r, axis }) => ({ key, look, x, y, z, len: +len.toFixed(2), r, axis });
    expect(rods.map(at)).toEqual([
      { key: 'part.leg', look: 'handle', x: 20, y: 80.88, z: 60, len: 15.12, r: 16, axis: 'y' }, // 96 - 15.12
      { key: 'part.leg', look: 'handle', x: 20, y: 45.6, z: 60, len: 35.28, r: 12, axis: 'y' }, // 12 + 33.6; 50.4 - 15.12
      { key: 'part.leg', look: 'rod', x: 20, y: 12, z: 60, len: 33.6, r: 5, axis: 'y' },
      { key: 'part.leg', look: 'handle', x: 20, y: 0, z: 60, len: 12, r: 17, axis: 'y' },
    ]);
  });

  it('низька ніжка стискається пропорційно: 20 → пластина 2, п’ята 3', () => {
    const L = geometryBuilder();
    addLeg(L, 0, 0, 20);
    const r = L.result();
    expect(r.boxes[0]).toMatchObject({ y: 18, h: 2 });
    expect(r.rods.at(-1)).toMatchObject({ y: 0, len: 3 });
    expect(r.rods.reduce((s, x) => s + x.len, 0) + 2).toBeCloseTo(20, 6);
  });
});

describe('addLegGeometry', () => {
  it('у ряду задня (40 від стінки) і передня (за цоколем: 554 - 40 - 10); по пластині й 4 циліндри на ніжку', () => {
    const G = geometryBuilder();
    addLegGeometry(G, [0, 760], 100, 554);
    const { boxes, rods } = G.result();
    expect(boxes.map(({ x, z }) => [x, z])).toEqual([
      [0, 40],
      [0, 504],
      [760, 40],
      [760, 504],
    ]);
    expect(rods).toHaveLength(16);
  });
});
