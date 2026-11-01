import { describe, it, expect } from 'vitest';
import { exportRows, toCsv, toTsv, fileBase, panelSize, projectReport } from './export.js';
import { presetProject, PLINTH } from './test-fixtures.js';

describe('exportRows', () => {
  const rows = exportRows(presetProject('wardrobe', PLINTH));

  it('починається з габаритів', () => {
    expect(rows[0]).toEqual(['Габарит (Ш × В × Г), мм', '1800 × 2400 × 600', '']);
    expect(rows[1]).toEqual(['Цоколь, мм', 80, '']);
  });

  it('кришка: за замовчуванням — між боковинами, одинарна', () => {
    expect(rows[2]).toEqual(['Кришка', 'Між боковинами', '']);
  });

  it('кришка: над боковинами, потовщена', () => {
    const r = exportRows({ ...presetProject('wardrobe', PLINTH), top: { mount: 'over', double: true } });
    expect(r[2]).toEqual(['Кришка', 'Над боковинами, потовщена (2 плити)', '']);
    // деталі відповідають налаштуванню (розрахунок — див. parts.test.js)
    expect(r).toContainEqual(['Кришка', '1800 × 600', 2]);
    expect(r).toContainEqual(['Боковина', '2368 × 600', 2]);
  });

  it('кришка: виступи у рядку кришки', () => {
    const r = exportRows({
      ...presetProject('wardrobe', PLINTH),
      top: { mount: 'over', overhang: { back: 0, front: 20, left: 0, right: 0 } },
    });
    expect(r[2]).toEqual(['Кришка', 'Над боковинами; виступи: ззаду 0, спереду 20, зліва 0, справа 0 мм', '']);
    expect(r).toContainEqual(['Кришка', '1800 × 620', 1]); // 600 + 20
  });

  it('містить перекладені деталі та опис', () => {
    expect(rows).toContainEqual(['Боковина', '2400 × 600', 2]);
    expect(rows).toContainEqual(['Ящик (блок)', 'фасад 594 × 196, глибина ~550', 3]);
  });

  // площа листа: 2800 * 2070 = 5 796 000 мм² ≈ 5,80 м²
  it('містить площу й кількість листів (числа — див. parts.test.js)', () => {
    expect(rows).toContainEqual(['Матеріал', 'Площа, м²', 'Листів']);
    expect(rows).toContainEqual(['ДСП, лист 2800 × 2070 (5,80 м²)', '10,66', 2]);
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
  it('fileBase', () => expect(fileBase(presetProject('wardrobe', PLINTH))).toBe('shafa-1800x2400x600'));
  it('panelSize', () => expect(panelSize({ a: 2400, b: 600 })).toBe('2400 × 600'));
});

describe('projectReport — виробничі попередження', () => {
  it('задня стінка ширша за лист ДВП: W 2500, H 2400', () => {
    // задня стінка (2400 - 4) × (2500 - 4) = 2396 × 2496; лист 2800 × 2070: 2496 > 2070 і 2396 > 2070
    const R = projectReport({ ...presetProject('wardrobe', PLINTH), W: 2500 });
    expect(R.warns).toContainEqual(
      expect.objectContaining({ key: 'check.panelTooBig', params: expect.objectContaining({ a: 2396, b: 2496 }) }),
    );
  });

  it('боковина вища за робочу площу ДСП: H 2800 > 2780', () => {
    const R = projectReport({ ...presetProject('penal', PLINTH), H: 2800 });
    expect(R.warns).toContainEqual(
      expect.objectContaining({
        key: 'check.panelTooBig',
        params: expect.objectContaining({ part: { key: 'part.side' } }),
      }),
    );
  });

  it('errs і warns типу теж у звіті', () => {
    const R = projectReport({ ...presetProject('wardrobe', PLINTH), W: 200 });
    expect(R.errs.map(e => e.key)).toContain('check.tooSmall');
  });
});
