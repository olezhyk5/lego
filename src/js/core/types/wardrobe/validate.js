import { TOP_MOUNTS, TOP_OVERHANG_SIDES } from '../../../config/constants.js';
import { ZONE_TYPES, COUNTABLE_ZONES } from './constants.js';
import { runValidation, isPlainObject } from '../../validate.js';

// Межі навмисно широкі: це перевірка формату, а не конструкції (її робить check.* у layout)
const MAX_MM = 10000;
const MAX_SMALL_MM = 1000; // цоколь, виступи кришки
const MAX_ITEMS = 30; // секцій, зон у секції
const MAX_COUNT = 20; // полиць / ящиків у зоні

const field = (name, params) => ({ key: `validate.field.${name}`, params });

/** @param {import('../../validate.js').Checker} check */
function normalizeTop(top, check) {
  if (!check.object(top, ['top'], field('top'))) return undefined;
  const out = {};
  if (top.mount !== undefined && check.oneOf(top.mount, TOP_MOUNTS, ['top', 'mount'], field('topMount')))
    out.mount = top.mount;
  if (top.double !== undefined && check.boolean(top.double, ['top', 'double'], field('topDouble')))
    out.double = top.double;
  if (top.overhang !== undefined && check.object(top.overhang, ['top', 'overhang'], field('topOverhang'))) {
    out.overhang = {};
    TOP_OVERHANG_SIDES.forEach(side => {
      const v = top.overhang[side];
      const f = field('topOverhangSide', { side: { key: `topOverhang.${side}` } });
      if (v !== undefined && check.number(v, ['top', 'overhang', side], f, 0, MAX_SMALL_MM)) out.overhang[side] = v;
    });
  }
  return out;
}

/** @param {import('../../validate.js').Checker} check */
function normalizeZone(z, i, j, check) {
  const path = ['sections', i, 'zones', j];
  const p = { n: i + 1, z: j + 1 };
  if (!check.object(z, path, field('zone', p))) return null;
  const out = {};
  if (check.oneOf(z.type, ZONE_TYPES, [...path, 'type'], field('zoneType', p))) out.type = z.type;
  if (check.autoOrNumber(z.height, [...path, 'height'], field('zoneHeight', p), 1, MAX_MM)) out.height = z.height;
  if (COUNTABLE_ZONES.includes(z.type)) {
    if (check.integer(z.count, [...path, 'count'], field('zoneCount', p), 1, MAX_COUNT)) out.count = z.count;
  } else if (Number.isInteger(z.count) && z.count >= 1 && z.count <= MAX_COUNT) {
    // у зоні без кількості поле не перевіряємо: UI зберігає його, щоб не губити при зміні типу
    out.count = z.count;
  }
  return out;
}

/** @param {import('../../validate.js').Checker} check */
function normalizeSection(c, i, check) {
  const path = ['sections', i];
  const p = { n: i + 1 };
  if (!check.object(c, path, field('section', p))) return null;
  const out = {};
  if (check.autoOrNumber(c.width, [...path, 'width'], field('sectionWidth', p), 1, MAX_MM)) out.width = c.width;
  if (check.array(c.zones, [...path, 'zones'], field('zones', p), 1, MAX_ITEMS))
    out.zones = c.zones.map((z, j) => normalizeZone(z, i, j, check));
  return out;
}

/**
 * Поля шафи: перевірка + нормалізація (невідомі поля відкидаються).
 * @param {any} s
 * @param {import('../../validate.js').Checker} check
 */
export function normalizeWardrobe(s, check) {
  const out = {};
  for (const k of ['W', 'H', 'D']) if (check.number(s[k], [k], field(k), 1, MAX_MM)) out[k] = s[k];
  if (check.number(s.plinth, ['plinth'], field('plinth'), 0, MAX_SMALL_MM)) out.plinth = s.plinth;
  if (s.top !== undefined && isPlainObject(s.top)) out.top = normalizeTop(s.top, check);
  else if (s.top !== undefined) check.object(s.top, ['top'], field('top'));
  if (check.array(s.sections, ['sections'], field('sections'), 1, MAX_ITEMS))
    out.sections = s.sections.map((c, i) => normalizeSection(c, i, check));
  return out;
}

/** @param {import('../../types.js').Project} project */
export const validateWardrobe = project => runValidation(project, normalizeWardrobe);
