import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, it, expect } from 'vitest';
import { TOP_MOUNTS, TOP_OVERHANG_SIDES } from '../config/constants.js';
import { ZONE_TYPES } from '../core/types/wardrobe/constants.js';
import { presetIds } from '../core/presets.js';
import { typeIds, getType } from '../core/registry.js';
import { MATERIALS } from '../config/materials.js';
import uk from './locales/uk.js';

const ROOT = join(import.meta.dirname, '../../..');
const SRC = join(ROOT, 'src/js');

// плоский список ключів: {a: {b: 'x'}} → ['a.b']
const flatKeys = (obj, prefix = '') =>
  Object.entries(obj).flatMap(([k, v]) => (typeof v === 'string' ? [prefix + k] : flatKeys(v, `${prefix}${k}.`)));

const UK_KEYS = new Set(flatKeys(uk));
const NAMESPACES = Object.keys(uk).join('|');

const locales = import.meta.glob('./locales/*.js', { eager: true, import: 'default' });

describe('словники', () => {
  it.each(Object.keys(locales))('%s має ті самі ключі, що й uk.js', path => {
    expect(flatKeys(locales[path]).sort()).toEqual([...UK_KEYS].sort());
  });

  it.each(Object.keys(locales))('%s: параметри {…} збігаються з uk.js', path => {
    const params = s => (s.match(/\{\w+\}/g) || []).sort();
    const dict = locales[path];
    UK_KEYS.forEach(key => {
      const get = d => key.split('.').reduce((o, k) => o[k], d);
      expect(params(get(dict)), key).toEqual(params(get(uk)));
    });
  });
});

// Шукає в коді й розмітці рядкові літерали виду 'namespace.key', де namespace — верхній рівень uk.js.
function usedKeys() {
  const files = readdirSync(SRC, { recursive: true })
    .filter(f => f.endsWith('.js') && !f.endsWith('.test.js') && !f.startsWith('i18n/locales'))
    .map(f => join(SRC, f))
    .concat(join(ROOT, 'index.html'));
  const re = new RegExp(`['"\`]((?:${NAMESPACES})\\.[a-zA-Z0-9.]+)['"\`]`, 'g');
  return files.flatMap(file => [...readFileSync(file, 'utf8').matchAll(re)].map(m => ({ key: m[1], file })));
}

describe('ключі, що використовуються', () => {
  it('кожен ключ з коду та index.html існує в uk.js', () => {
    const missing = usedKeys()
      .filter(({ key }) => !UK_KEYS.has(key))
      .map(({ key, file }) => `${key} (${relative(ROOT, file)})`);
    expect(missing).toEqual([]);
  });

  it('знаходить ключі в коді (перевірка самого пошуку)', () => {
    expect(usedKeys().length).toBeGreaterThan(50);
  });

  it('є назва для кожного пресета', () => {
    presetIds().forEach(id => expect(UK_KEYS.has(`preset.${id}`), id).toBe(true));
  });

  it('є назва й заголовки опису для кожного типу меблів', () => {
    typeIds().forEach(id => {
      expect(UK_KEYS.has(`type.${id}`), id).toBe(true);
      Object.values(getType(id).describeTitle).forEach(key => expect(UK_KEYS.has(key), key).toBe(true));
    });
  });

  it('є назва для кожного матеріалу', () => {
    Object.keys(MATERIALS).forEach(k => expect(UK_KEYS.has(`material.${k}`), k).toBe(true));
  });

  it('є назва для кожного типу зони', () => {
    ZONE_TYPES.forEach(k => expect(UK_KEYS.has(`zoneType.${k}`), k).toBe(true));
  });

  it('є назва для кожного кріплення кришки', () => {
    TOP_MOUNTS.forEach(k => expect(UK_KEYS.has(`topMount.${k}`), k).toBe(true));
  });

  it('є назва для кожного боку виступу кришки', () => {
    TOP_OVERHANG_SIDES.forEach(k => expect(UK_KEYS.has(`topOverhang.${k}`), k).toBe(true));
  });
});
