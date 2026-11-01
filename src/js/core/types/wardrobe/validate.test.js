import { describe, it, expect } from 'vitest';
import { validateWardrobe } from './validate.js';
import { MAX_ERRORS } from '../../validate.js';
import { presetProject } from '../../test-fixtures.js';
import { PRESETS } from './presets.js';

const base = () => presetProject('wardrobe2');
// Перша помилка: [key, path]
const firstError = p => {
  const res = validateWardrobe(p);
  return res.ok ? null : [res.errors[0].key, res.errors[0].path];
};

describe('validateWardrobe', () => {
  it.each(Object.keys(PRESETS))('пресет %s валідний і не змінюється нормалізацією', key => {
    expect(validateWardrobe(presetProject(key))).toEqual({ ok: true, project: presetProject(key) });
  });

  it('основа зберігається', () => {
    const res = validateWardrobe({ ...base(), base: 'legs' });
    expect(res.ok && res.project.base).toBe('legs');
  });

  it('кришка з виступами зберігається', () => {
    const top = { mount: 'over', double: true, overhang: { back: 0, front: 20, left: 10, right: 10 } };
    const res = validateWardrobe({ ...base(), top });
    expect(res.ok && res.project.top).toEqual(top);
  });

  it.each([
    ['W не число', p => (p.W = 'abc'), ['validate.number', ['W']]],
    ['H = 0', p => (p.H = 0), ['validate.range', ['H']]],
    ['D > 10000', p => (p.D = 10001), ['validate.range', ['D']]],
    ['plinth від’ємний', p => (p.plinth = -1), ['validate.range', ['plinth']]],
    ['base невідома', p => (p.base = 'wheels'), ['validate.enum', ['base']]],
    ['top не об’єкт', p => (p.top = 'over'), ['validate.object', ['top']]],
    ['top.mount невідомий', p => (p.top = { mount: 'under' }), ['validate.enum', ['top', 'mount']]],
    ['top.double не boolean', p => (p.top = { double: 1 }), ['validate.boolean', ['top', 'double']]],
    [
      'виступ від’ємний',
      p => (p.top = { mount: 'over', overhang: { front: -5 } }),
      ['validate.range', ['top', 'overhang', 'front']],
    ],
    ['sections не масив', p => (p.sections = {}), ['validate.array', ['sections']]],
    ['sections порожній', p => (p.sections = []), ['validate.arrayLength', ['sections']]],
    ['секція не об’єкт', p => (p.sections[1] = 5), ['validate.object', ['sections', 1]]],
    ['ширина — рядок', p => (p.sections[0].width = 'abc'), ['validate.number', ['sections', 0, 'width']]],
    ['zones = null', p => (p.sections[0].zones = null), ['validate.array', ['sections', 0, 'zones']]],
    [
      'невідомий тип зони',
      p => (p.sections[1].zones[0].type = 'sofa'),
      ['validate.enum', ['sections', 1, 'zones', 0, 'type']],
    ],
    ['висота 0', p => (p.sections[1].zones[2].height = 0), ['validate.range', ['sections', 1, 'zones', 2, 'height']]],
    [
      'кількість дробова',
      p => (p.sections[1].zones[1].count = 2.5),
      ['validate.integer', ['sections', 1, 'zones', 1, 'count']],
    ],
    [
      'кількість > 20',
      p => (p.sections[1].zones[2].count = 21),
      ['validate.range', ['sections', 1, 'zones', 2, 'count']],
    ],
  ])('%s', (_, mutate, expected) => {
    const p = base();
    mutate(p);
    expect(firstError(p)).toEqual(expected);
  });

  it('у параметрах помилки — назва поля як повідомлення', () => {
    const p = base();
    p.sections[1].zones[0].type = 'sofa';
    const res = validateWardrobe(p);
    expect(!res.ok && res.errors[0].params).toEqual({
      field: { key: 'validate.field.zoneType', params: { n: 2, z: 1 } },
      value: 'sofa',
    });
  });

  it('count у зоні без кількості не перевіряється: коректний лишається, некоректний відкидається', () => {
    const p = base();
    p.sections[0].zones[1] = { type: 'rod', height: 'auto', count: 3 };
    let res = validateWardrobe(p);
    expect(res.ok && res.project.sections[0].zones[1]).toEqual({ type: 'rod', height: 'auto', count: 3 });
    p.sections[0].zones[1].count = 'x';
    res = validateWardrobe(p);
    expect(res.ok && res.project.sections[0].zones[1]).toEqual({ type: 'rod', height: 'auto' });
  });

  it('невідомі поля відкидаються на всіх рівнях', () => {
    const p = /** @type {any} */ (base());
    p.extra = 1;
    p.top = { mount: 'between', foo: 2 };
    p.sections[0].color = 'red';
    p.sections[0].zones[0].note = 'x';
    const res = validateWardrobe(p);
    expect(res.ok).toBe(true);
    const out = /** @type {any} */ (res.ok && res.project);
    expect(out.extra).toBeUndefined();
    expect(out.top).toEqual({ mount: 'between' });
    expect(out.sections[0].color).toBeUndefined();
    expect(out.sections[0].zones[0].note).toBeUndefined();
  });

  it(`не більше ${MAX_ERRORS} помилок`, () => {
    const p = base();
    p.sections = Array.from({ length: 15 }, () => ({ width: 'x', zones: [{ type: 'x', height: 'x' }] }));
    const res = validateWardrobe(p);
    expect(!res.ok && res.errors.length).toBe(MAX_ERRORS);
  });
});
