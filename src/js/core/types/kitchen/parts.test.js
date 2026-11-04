import { describe, it, expect } from 'vitest';
import { computeLayout } from './layout.js';
import { partsList, summary, describe as describeModules } from './parts.js';
import { kitchen as kitchenType } from './index.js';
import { modelGeometry } from './geometry.js';
import { annotations } from './annotations.js';
import { kitchenPreset, kitchen, expectGeometryMatchesParts } from '../../test-fixtures.js';
import uk from '../../../i18n/locales/uk.js';

// Пресет «Кухня 1,8 м»: шухляди 600 (4), мийка 600, двері 600 (2). H 720, D 560, ніжки 100.
// Всередині модуля 600 - 2*16 = 568.
describe('нетипова товщина стільниці', () => {
  const s = kitchen([{ width: 600, type: 'doors', count: 1 }], { worktop: { front: 30, left: 0, right: 0, t: 28 } });
  const L = computeLayout(s);
  const P = partsList(s, L);

  it('є в плиті специфікації (типова 38 — без поля, див. пресет нижче)', () => {
    expect(P.panels).toContainEqual({ key: 'part.worktop', mat: 'worktop', a: 600, b: 590, q: 1, t: 28 }); // 560 + 30
  });

  it('геометрія збігається зі специфікацією', () => {
    expectGeometryMatchesParts(modelGeometry(s, L), P);
  });

  it('шапка показує задану товщину', () => {
    expect(summary(s, L)).toContainEqual({
      label: { key: 'export.worktop' },
      value: { key: 'export.worktopValue', params: { t: 28, front: 30, left: 0, right: 0 } },
    });
  });
});

describe('partsList — пресет «Кухня 1,8 м»', () => {
  const s = kitchenPreset('line180');
  const L = computeLayout(s);
  const P = partsList(s, L);

  it('плити', () => {
    expect(P.panels).toEqual([
      { key: 'part.side', mat: 'chipboard', a: 720, b: 560, q: 6 }, // по 2 на модуль
      { key: 'part.bottom', mat: 'chipboard', a: 568, b: 560, q: 3 },
      { key: 'part.rail', mat: 'chipboard', a: 568, b: 100, q: 6 }, // передня й задня царга
      { key: 'part.shelf', mat: 'chipboard', a: 568, b: 540, q: 1 }, // лише в модулі з дверима; 560 - 20
      { key: 'part.drawerFront', mat: 'chipboard', a: 594, b: 176, q: 4 }, // (720 - 5*3) / 4 = 176,25
      { key: 'part.door', mat: 'chipboard', a: 296, b: 714, q: 4 }, // (600 - 6 - 3) / 2 = 295,5; 2 у мийці + 2
      // корпус шухляди: ширина 568 - 2*13 = 542, стінки 176,25 - 40 ≈ 136, глибина 560 - 50 = 510 → 500 (ряд)
      { key: 'part.drawerSide', mat: 'chipboard', a: 500, b: 136, q: 8 },
      { key: 'part.drawerWall', mat: 'chipboard', a: 510, b: 136, q: 8 }, // 542 - 2*16
      { key: 'part.drawerBottom', mat: 'hardboard', a: 542, b: 500, q: 4 },
      { key: 'part.plinth', mat: 'chipboard', a: 1800, b: 100, q: 1 },
      { key: 'part.worktop', mat: 'worktop', a: 1800, b: 590, q: 1 }, // 560 + 30
      { key: 'part.back', mat: 'hardboard', a: 716, b: 596, q: 3 }, // 720 - 4, 600 - 4
    ]);
  });

  it('фурнітура', () => {
    expect(P.items).toEqual([
      { key: 'part.runner', size: { key: 'itemSize.runner', params: { l: 500 } }, q: 4 }, // пара на шухляду
      { key: 'part.handle', size: { key: 'itemSize.handle' }, q: 8 }, // 4 шухляди + 4 двері
      { key: 'part.hinge', size: { key: 'itemSize.hinge' }, q: 8 }, // по 2 на двері
      { key: 'part.sink', size: { key: 'itemSize.sink', params: { w: 600 } }, q: 1 },
      { key: 'part.leg', size: { key: 'itemSize.leg', params: { h: 100 } }, q: 12 }, // модулі по 600: 2 ряди × 2 ніжки × 3 модулі
    ]);
  });

  it('шапка й ім’я файлу', () => {
    expect(summary(s, L)).toEqual([
      { label: { key: 'export.overall' }, value: '1800 × 858 × 590' }, // 100 + 720 + 38
      { label: { key: 'export.kitchenCarcass' }, value: '720 × 560' },
      { label: { key: 'export.legs' }, value: 100 },
      {
        label: { key: 'export.worktop' },
        value: { key: 'export.worktopValue', params: { t: 38, front: 30, left: 0, right: 0 } },
      },
    ]);
    expect(kitchenType.fileBase(s)).toBe('kukhnia-1800x858x590');
  });

  it('опис модулів', () => {
    expect(describeModules(s, L).map(d => d.children[0])).toEqual([
      { key: 'describe.moduleDrawers', params: { cnt: 4, front: 176 } },
      { key: 'describe.moduleSink', params: { cnt: 2 } },
      { key: 'describe.moduleDoors', params: { cnt: 2, w: 296, h: 714 } },
    ]);
  });
});

describe('посудомийка (пресети її не містять)', () => {
  const s = kitchen([
    { width: 600, type: 'open', count: 0 },
    { width: 450, type: 'dishwasher' },
  ]);
  const L = computeLayout(s);
  const P = partsList(s, L);

  it('плити: фасад 444 × 714 і додаткова боковина скраю; корпус — тільки у відкритого модуля', () => {
    expect(P.panels).toEqual([
      { key: 'part.side', mat: 'chipboard', a: 720, b: 560, q: 2 },
      { key: 'part.bottom', mat: 'chipboard', a: 568, b: 560, q: 1 }, // 600 - 2*16
      { key: 'part.rail', mat: 'chipboard', a: 568, b: 100, q: 2 },
      { key: 'part.side', mat: 'chipboard', a: 820, b: 560, q: 1 }, // від підлоги: 100 + 720
      { key: 'part.dishwasherFront', mat: 'chipboard', a: 444, b: 714, q: 1 }, // 450 - 2*3, 720 - 2*3
      { key: 'part.plinth', mat: 'chipboard', a: 1050, b: 100, q: 1 }, // 600 + 450, до боковини
      { key: 'part.worktop', mat: 'worktop', a: 1066, b: 590, q: 1 }, // 600 + 450 + 16
      { key: 'part.back', mat: 'hardboard', a: 716, b: 596, q: 1 }, // 720 - 4, 600 - 4
    ]);
  });

  it('фурнітура: ручка й техніка без петель; ніжки лише під відкритим модулем', () => {
    expect(P.items).toEqual([
      { key: 'part.handle', size: { key: 'itemSize.handle' }, q: 1 },
      { key: 'part.dishwasher', size: { key: 'itemSize.dishwasher', params: { w: 450 } }, q: 1 },
      { key: 'part.leg', size: { key: 'itemSize.leg', params: { h: 100 } }, q: 4 }, // 2 ряди × 2 ніжки
    ]);
  });

  it('опис і геометрія = специфікація', () => {
    expect(describeModules(s, L)[1].children).toEqual([
      { key: 'describe.moduleDishwasher', params: { w: 444, h: 714 } },
    ]);
    expectGeometryMatchesParts(modelGeometry(s, L), P);
  });

  it('ключі, що складаються динамічно, є в словнику', () => {
    expect(uk.moduleType.dishwasher).toBeTruthy();
    expect(annotations(s, L, { sel: 0 }).labels[1].lines[0].key).toBe('viewer.label.module.dishwasher');
    expect(uk.viewer.label.module.dishwasher).toBeTruthy();
  });
});

describe('partsList — умовні деталі', () => {
  it('без ніжок немає цокольної планки й ніжок', () => {
    const s = kitchen([{ width: 600, type: 'open', count: 0 }], { legs: 0 });
    const P = partsList(s, computeLayout(s));
    expect(P.panels.some(p => p.key === 'part.plinth')).toBe(false);
    expect(P.items).toEqual([]); // відкритий модуль без полиць: ні ручок, ні петель
  });

  it('широкий модуль — додатковий ряд ніжок', () => {
    const s = kitchen([
      { width: 600, type: 'open', count: 0 },
      { width: 900, type: 'open', count: 0 },
    ]);
    const leg = partsList(s, computeLayout(s)).items.find(i => i.key === 'part.leg');
    expect(leg.q).toBe(10); // 600: 2 ряди, 900: 3 ряди (900 - 120 > 700); по 2 ніжки в ряду
  });
});
