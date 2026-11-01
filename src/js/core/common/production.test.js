import { describe, it, expect } from 'vitest';
import { fitsSheet, usableSheet, sheetFitWarnings } from './production.js';

// ДСП: лист 2800 × 2070, обрізка 10 → робоча площа 2780 × 2050. ДВП: 2800 × 2070 без обрізки.
describe('fitsSheet', () => {
  it('робоча площа = лист мінус обрізка з кожного боку', () => {
    expect(usableSheet('chipboard')).toEqual({ a: 2780, b: 2050 });
    expect(usableSheet('hardboard')).toEqual({ a: 2800, b: 2070 });
  });

  it.each([
    [{ a: 2780, b: 2050, mat: 'chipboard' }, true], // рівно в робочу площу
    [{ a: 2050, b: 2780, mat: 'chipboard' }, true], // з поворотом
    [{ a: 2790, b: 600, mat: 'chipboard' }, false], // 2790 > 2780
    [{ a: 2100, b: 2100, mat: 'chipboard' }, false], // 2100 > 2050 в обидва боки
    [{ a: 2800, b: 2070, mat: 'hardboard' }, true],
  ])('%j → %s', (p, ok) => expect(fitsSheet(p)).toBe(ok));
});

describe('sheetFitWarnings', () => {
  it('одне попередження на рядок специфікації, з назвами як повідомленнями', () => {
    const panels = [
      { key: 'part.side', mat: 'chipboard', a: 2800, b: 600, q: 2 },
      { key: 'part.shelf', mat: 'chipboard', a: 1000, b: 580, q: 3 },
    ];
    expect(sheetFitWarnings(panels)).toEqual([
      {
        key: 'check.panelTooBig',
        params: { part: { key: 'part.side' }, a: 2800, b: 600, mat: { key: 'material.chipboard' }, sa: 2780, sb: 2050 },
      },
    ]);
  });

  it('стільницю (sheetCheck: false) не перевіряє', () => {
    expect(sheetFitWarnings([{ key: 'part.worktop', mat: 'worktop', a: 4000, b: 600, q: 1 }])).toEqual([]);
  });
});
