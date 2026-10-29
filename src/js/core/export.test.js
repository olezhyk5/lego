import { describe, it, expect } from 'vitest';
import { exportRows, toCsv, toTsv, fileBase, panelSize } from './export.js';
import { preset } from './test-fixtures.js';

describe('exportRows', () => {
  const rows = exportRows(preset('wardrobe'));

  it('починається з габаритів', () => {
    expect(rows[0]).toEqual(['Габарит (Ш × В × Г), мм', '1800 × 2400 × 600', '']);
    expect(rows[1]).toEqual(['Цоколь, мм', 80, '']);
  });

  it('містить перекладені деталі та опис', () => {
    expect(rows).toContainEqual(['Боковина', '2400 × 600', 2]);
    expect(rows).toContainEqual(['Ящик (блок)', 'фасад 594 × 196, глибина ~550', 3]);
  });

  // площа листа: 2800 * 2070 = 5 796 000 мм² ≈ 5,80 м²
  it('містить площу й кількість листів (числа — див. parts.test.js)', () => {
    expect(rows).toContainEqual(['Матеріал', 'Площа, м²', 'Листів']);
    expect(rows).toContainEqual(['ДСП, лист 2800 × 2070 (5,80 м²)', '10,32', 2]);
    expect(rows).toContainEqual(['ДВП, лист 2800 × 2070 (5,80 м²)', '4,30', 1]);
    expect(rows.at(-1)).toEqual(['Секція 3 (568 мм): порожньо 400 → штанга, висота 1872']);
  });
});

describe('toCsv', () => {
  it('BOM, роздільник «;», CRLF, лапки екрануються', () => {
    expect(toCsv([['a"b', null, 3], []])).toBe('﻿"a""b";"";"3"\r\n');
  });
});

describe('toTsv', () => {
  it('таби та переноси рядків', () => {
    expect(toTsv([['a', 1], ['b']])).toBe('a\t1\nb');
  });
});

describe('імена та розміри', () => {
  it('fileBase', () => expect(fileBase({ W: 1800, H: 2400, D: 600 })).toBe('shafa-1800x2400x600'));
  it('panelSize', () => expect(panelSize({ a: 2400, b: 600 })).toBe('2400 × 600'));
});
