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
    ['modules порожній', p => (p.modules = []), ['validate.arrayLength', ['modules']]],
    ['ширина — рядок', p => (p.modules[0].width = 'auto'), ['validate.number', ['modules', 0, 'width']]],
    ['невідомий тип', p => (p.modules[1].type = 'oven'), ['validate.enum', ['modules', 1, 'type']]],
    ['троє дверей', p => (p.modules[2].count = 3), ['validate.range', ['modules', 2, 'count']]],
    ['ящики без кількості', p => delete p.modules[0].count, ['validate.integer', ['modules', 0, 'count']]],
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

  it('стільниця необов’язкова', () => {
    const p = /** @type {any} */ (base());
    delete p.worktop;
    expect(validateKitchen(p).ok).toBe(true);
  });
});
