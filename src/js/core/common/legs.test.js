import { describe, it, expect } from 'vitest';
import { legRows, legCount, legsLowWarning, addLegGeometry } from './legs.js';
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

describe('addLegGeometry', () => {
  it('у ряду задня (40 від стінки) і передня (за цоколем: 554 - 40 - 10)', () => {
    const G = geometryBuilder();
    addLegGeometry(G, [0, 760], 100, 554);
    expect(G.result().boxes.map(({ kind, key, x, y, z, w, h, d }) => [kind, key, x, y, z, w, h, d])).toEqual([
      ['hardware', 'part.leg', 0, 0, 40, 40, 100, 40],
      ['hardware', 'part.leg', 0, 0, 504, 40, 100, 40],
      ['hardware', 'part.leg', 760, 0, 40, 40, 100, 40],
      ['hardware', 'part.leg', 760, 0, 504, 40, 100, 40],
    ]);
  });
});
