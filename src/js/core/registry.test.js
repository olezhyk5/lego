import { describe, it, expect } from 'vitest';
import { typeIds, getType, hasType } from './registry.js';
import { presetIds, presetProject } from './presets.js';
import { MATERIALS } from '../config/materials.js';
import { LOOKS } from '../config/constants.js';
import uk from '../i18n/locales/uk.js';
import { expectGeometryMatchesParts } from './test-fixtures.js';

// Контракт типу меблів (FurnitureType у types.js). Проходить по всіх типах реєстру,
// тож новий тип перевіряється без окремого коду.

const hasKey = key => typeof key.split('.').reduce((o, k) => (o == null ? o : o[k]), uk) === 'string';
// Усі ключі повідомлення разом із вкладеними (параметри-повідомлення)
const msgKeys = m =>
  m && typeof m === 'object' && m.key
    ? [m.key, ...Object.values(m.params || {}).flatMap(msgKeys), ...(m.children || []).flatMap(msgKeys)]
    : [];
const isPosInt = v => Number.isInteger(v) && v > 0;

const isFinitePos = v => Number.isFinite(v) && v > 0;

describe.each(typeIds())('тип %s', id => {
  const type = getType(id);

  it('є в реєстрі, має пресети й пресет за замовчуванням', () => {
    expect(hasType(id)).toBe(true);
    expect(type.id).toBe(id);
    expect(Object.keys(type.presets).length).toBeGreaterThan(0);
    expect(type.presets[type.defaultPreset]).toBeDefined();
    expect(hasKey(type.describeTitle.report) && hasKey(type.describeTitle.export)).toBe(true);
  });

  describe.each(presetIds(id))('пресет %s', presetId => {
    const s = presetProject(presetId);
    const L = type.layout(s);

    it('проходить валідацію без змін', () => {
      expect(type.validate(s)).toEqual({ ok: true, project: s });
    });

    it('розрахунок без помилок, габарити додатні', () => {
      expect(L.errs).toEqual([]);
      expect(Object.values(L.bounds).every(isFinitePos)).toBe(true);
    });

    it('специфікація: відомі ключі, матеріали, цілі розміри', () => {
      const P = type.parts(s, L);
      expect(P.panels.length).toBeGreaterThan(0);
      P.panels.forEach(p => {
        expect(hasKey(p.key), p.key).toBe(true);
        expect(Object.hasOwn(MATERIALS, p.mat), p.mat).toBe(true);
        expect(isPosInt(p.a) && isPosInt(p.b) && isPosInt(p.q), JSON.stringify(p)).toBe(true);
      });
      P.items.forEach(p => {
        expect(hasKey(p.key), p.key).toBe(true);
        msgKeys(p.size).forEach(k => expect(hasKey(k), k).toBe(true));
        expect(isPosInt(p.q)).toBe(true);
      });
    });

    it('геометрія: відомі ролі матеріалів, скінченні розміри', () => {
      const G = type.geometry(s, L);
      expect(G.boxes.length).toBeGreaterThan(0);
      G.boxes.forEach(b => expect(['panel', 'hardware']).toContain(b.kind));
      [...G.boxes, ...G.rods].forEach(b => {
        expect(LOOKS, b.key).toContain(b.look);
        expect(hasKey(b.key), b.key).toBe(true);
      });
      G.boxes.forEach(b => expect([b.x, b.y, b.z, b.w, b.h, b.d].every(Number.isFinite)).toBe(true));
    });

    it('геометрія = специфікація поштучно (ключ, матеріал, розміри, товщина)', () => {
      expectGeometryMatchesParts(type.geometry(s, L), type.parts(s, L));
    });

    it('підписи, шапка й опис — лише відомі ключі', () => {
      const A = type.annotations(s, L, { sel: 0 });
      const msgs = [
        ...A.labels.flatMap(l => l.lines),
        ...type.summary(s, L).flatMap(r => [r.label, r.value]),
        ...type.describe(s, L),
      ];
      msgs.flatMap(msgKeys).forEach(k => expect(hasKey(k), k).toBe(true));
      A.dims.forEach(d => expect(typeof d.text).toBe('string'));
    });

    it('ім’я файлу — латиниця, цифри, x і дефіс', () => {
      expect(type.fileBase(s)).toMatch(/^[a-z0-9x-]+$/);
    });
  });
});
