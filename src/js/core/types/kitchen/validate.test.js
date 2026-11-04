import { describe, it, expect } from 'vitest';
import { validateKitchen } from './validate.js';
import { kitchenPreset } from '../../test-fixtures.js';

const base = () => kitchenPreset('line240');
const firstError = p => {
  const res = validateKitchen(p);
  return res.ok ? null : [res.errors[0].key, res.errors[0].path];
};

describe('validateKitchen', () => {
  it.each([
    ['H не число', p => (p.H = '720'), ['validate.number', ['H']]],
    ['ніжки від’ємні', p => (p.legs = -1), ['validate.range', ['legs']]],
    ['стільниця не об’єкт', p => (p.worktop = 30), ['validate.object', ['worktop']]],
    ['виступ стільниці від’ємний', p => (p.worktop.front = -1), ['validate.range', ['worktop', 'front']]],
    ['товщина стільниці 0', p => (p.worktop.t = 0), ['validate.range', ['worktop', 't']]],
    ['товщина стільниці — рядок', p => (p.worktop.t = '38'), ['validate.number', ['worktop', 't']]],
    ['modules порожній', p => (p.modules = []), ['validate.arrayLength', ['modules']]],
    ['ширина — рядок', p => (p.modules[0].width = 'auto'), ['validate.number', ['modules', 0, 'width']]],
    ['невідомий тип', p => (p.modules[1].type = 'oven'), ['validate.enum', ['modules', 1, 'type']]],
    ['троє дверей', p => (p.modules[2].count = 3), ['validate.range', ['modules', 2, 'count']]],
    ['шухляди без кількості', p => delete p.modules[0].count, ['validate.integer', ['modules', 0, 'count']]],
    ['верхні не список', p => (p.uppers = {}), ['validate.array', ['uppers']]],
    [
      'верхній модуль невідомого типу',
      p => (p.uppers = [{ width: 600, type: 'sink' }]),
      ['validate.enum', ['uppers', 0, 'type']],
    ],
    ['від’ємний відступ верхніх', p => (p.upper = { gap: -1 }), ['validate.range', ['upper', 'gap']]],
    ['пенал без зон', p => (p.modules[0] = { width: 600, type: 'tall' }), ['validate.array', ['modules', 0, 'zones']]],
    [
      'зона пенала невідомого типу',
      p => (p.modules[0] = { width: 600, type: 'tall', zones: [{ type: 'rod', height: 'auto' }] }),
      ['validate.enum', ['modules', 0, 'zones', 0, 'type']],
    ],
    [
      'холодильник без ніші',
      p => (p.modules[0] = { width: 600, type: 'fridge', nicheD: 550 }),
      ['validate.number', ['modules', 0, 'nicheH']],
    ],
    [
      'кут невідомого типу',
      p => (p.walls = [{ corner: { type: 'round', count: 1 }, modules: [] }]),
      ['validate.enum', ['walls', 0, 'corner', 'type']],
    ],
    [
      'Г-подібний кут без плеча',
      p => (p.walls = [{ corner: { type: 'lShape', a: 900, count: 1 }, modules: [] }]),
      ['validate.number', ['walls', 0, 'corner', 'b']],
    ],
    [
      'забагато стін',
      p => (p.walls = Array(3).fill({ corner: { type: 'lShape', a: 900, b: 900, count: 1 }, modules: [] })),
      ['validate.arrayLength', ['walls']],
    ],
    [
      'посудомийка нестандартної ширини',
      p => (p.modules[1] = { width: 500, type: 'dishwasher' }),
      ['validate.enum', ['modules', 1, 'width']],
    ],
  ])('%s', (_, mutate, expected) => {
    const p = base();
    mutate(p);
    expect(firstError(p)).toEqual(expected);
  });

  it('кількість у модулі під мийку відкидається; невідомі поля теж', () => {
    const p = /** @type {any} */ (base());
    p.modules[1].count = 7;
    p.modules[1].color = 'white';
    p.extra = true;
    const res = validateKitchen(p);
    const out = /** @type {any} */ (res.ok && res.project);
    expect(out.modules[1]).toEqual({ width: 800, type: 'sink' });
    expect(out.extra).toBeUndefined();
  });

  it('товщина стільниці зберігається', () => {
    const p = /** @type {any} */ (base());
    p.worktop.t = 28;
    const res = validateKitchen(p);
    const out = /** @type {any} */ (res.ok && res.project);
    expect(out.worktop).toEqual({ front: 30, left: 0, right: 0, t: 28 });
  });

  it('поля іншого типу модуля й кута відкидаються', () => {
    const p = /** @type {any} */ (base());
    p.modules[0].nicheH = 1800;
    p.walls = [{ corner: { type: 'blind', width: 1100, filler: 70, count: 1, a: 900 }, modules: [], extra: 1 }];
    const res = validateKitchen(p);
    const out = /** @type {any} */ (res.ok && res.project);
    expect(out.modules[0]).toEqual({ width: 600, type: 'drawers', count: 3 });
    expect(out.walls[0]).toEqual({ corner: { type: 'blind', width: 1100, filler: 70, count: 1 }, modules: [] });
  });

  it('стільниця необов’язкова', () => {
    const p = /** @type {any} */ (base());
    delete p.worktop;
    expect(validateKitchen(p).ok).toBe(true);
  });
});
