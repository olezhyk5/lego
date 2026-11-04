import { runValidation } from '../../validate.js';
import {
  MODULE_TYPES,
  MODULE_COUNT,
  WORKTOP_SIDES,
  DISHWASHER_WIDTHS,
  UPPER_TYPES,
  UPPER_COUNT,
  UPPER_FIELDS,
  TALL_ZONE_TYPES,
  TALL_ZONE_COUNT,
  CORNER_TYPES,
  CORNER_COUNT,
  MAX_WALLS,
} from './constants.js';

// Межі навмисно широкі: це перевірка формату, а не конструкції (її робить check.* у layout)
const MAX_MM = 10000;
const MAX_SMALL_MM = 1000; // ніжки, виступи й товщина стільниці
const MAX_MODULES = 30;
const MAX_ZONES = 10;

const field = (name, params) => ({ key: `validate.field.${name}`, params });

/** @param {import('../../validate.js').Checker} check */
function normalizeZone(z, path, p, check) {
  if (!check.object(z, path, field('moduleZone', p))) return null;
  const out = {};
  if (check.oneOf(z.type, TALL_ZONE_TYPES, [...path, 'type'], field('moduleZoneType', p))) out.type = z.type;
  if (check.autoOrNumber(z.height, [...path, 'height'], field('moduleZoneHeight', p), 1, MAX_MM)) out.height = z.height;
  const range = TALL_ZONE_COUNT[z.type];
  if (range && check.integer(z.count, [...path, 'count'], field('moduleZoneCount', p), range[0], range[1]))
    out.count = z.count;
  return out;
}

/** @param {import('../../validate.js').Checker} check */
function normalizeModule(m, path, n, check) {
  const p = { n };
  if (!check.object(m, path, field('module', p))) return null;
  const out = {};
  const widthPath = [...path, 'width'];
  const widthField = field('moduleWidth', p);
  const widthOk =
    m.type === 'dishwasher'
      ? check.oneOf(m.width, DISHWASHER_WIDTHS, widthPath, widthField)
      : check.number(m.width, widthPath, widthField, 1, MAX_MM);
  if (widthOk) out.width = m.width;
  if (check.oneOf(m.type, MODULE_TYPES, [...path, 'type'], field('moduleType', p))) out.type = m.type;
  const range = MODULE_COUNT[m.type];
  if (range && check.integer(m.count, [...path, 'count'], field('moduleCount', p), range[0], range[1]))
    out.count = m.count;
  if (m.type === 'fridge')
    ['nicheH', 'nicheD'].forEach(k => {
      if (check.number(m[k], [...path, k], field(`module${k === 'nicheH' ? 'NicheH' : 'NicheD'}`, p), 1, MAX_MM))
        out[k] = m[k];
    });
  if (m.type === 'tall' && check.array(m.zones, [...path, 'zones'], field('moduleZones', p), 1, MAX_ZONES))
    out.zones = m.zones.map((z, j) => normalizeZone(z, [...path, 'zones', j], { n, z: j + 1 }, check));
  return out;
}

/** @param {import('../../validate.js').Checker} check */
function normalizeUpperModule(m, path, n, check) {
  const p = { n };
  if (!check.object(m, path, field('upperModule', p))) return null;
  const out = {};
  if (check.number(m.width, [...path, 'width'], field('upperWidth', p), 1, MAX_MM)) out.width = m.width;
  if (check.oneOf(m.type, UPPER_TYPES, [...path, 'type'], field('upperType', p))) out.type = m.type;
  const range = UPPER_COUNT[m.type];
  if (range && check.integer(m.count, [...path, 'count'], field('upperCount', p), range[0], range[1]))
    out.count = m.count;
  return out;
}

/** @param {import('../../validate.js').Checker} check */
function normalizeCorner(c, path, n, check) {
  const p = { n };
  if (!check.object(c, path, field('corner', p))) return null;
  const out = {};
  if (check.oneOf(c.type, CORNER_TYPES, [...path, 'type'], field('cornerType', p))) out.type = c.type;
  const dims = c.type === 'blind' ? ['width', 'filler'] : c.type === 'lShape' ? ['a', 'b'] : [];
  dims.forEach(k => {
    if (check.number(c[k], [...path, k], field('cornerSize', p), k === 'filler' ? 0 : 1, MAX_MM)) out[k] = c[k];
  });
  if (check.integer(c.count, [...path, 'count'], field('cornerCount', p), CORNER_COUNT[0], CORNER_COUNT[1]))
    out.count = c.count;
  return out;
}

// Верхні модулі: нумерація спільна з усіма стінами, як у специфікації
function normalizeRows(src, path, counters, check, out) {
  if (check.array(src.modules, [...path, 'modules'], field('modules'), path.length ? 0 : 1, MAX_MODULES))
    out.modules = src.modules.map((m, i) => normalizeModule(m, [...path, 'modules', i], ++counters.base, check));
  if (src.uppers !== undefined && check.array(src.uppers, [...path, 'uppers'], field('uppers'), 0, MAX_MODULES))
    out.uppers = src.uppers.map((m, i) => normalizeUpperModule(m, [...path, 'uppers', i], ++counters.upper, check));
}

/**
 * Поля кухні: перевірка + нормалізація (невідомі поля відкидаються).
 * @param {any} s
 * @param {import('../../validate.js').Checker} check
 */
export function normalizeKitchen(s, check) {
  const out = {};
  for (const k of ['H', 'D']) if (check.number(s[k], [k], field(k), 1, MAX_MM)) out[k] = s[k];
  if (check.number(s.legs, ['legs'], field('legs'), 0, MAX_SMALL_MM)) out.legs = s.legs;
  if (s.worktop !== undefined && check.object(s.worktop, ['worktop'], field('worktop'))) {
    out.worktop = {};
    WORKTOP_SIDES.forEach(side => {
      const v = s.worktop[side];
      const f = field('worktopSide', { side: { key: `worktopSide.${side}` } });
      if (v !== undefined && check.number(v, ['worktop', side], f, 0, MAX_SMALL_MM)) out.worktop[side] = v;
    });
    const t = s.worktop.t;
    if (t !== undefined && check.number(t, ['worktop', 't'], field('worktopThickness'), 1, MAX_SMALL_MM))
      out.worktop.t = t;
  }
  if (s.upper !== undefined && check.object(s.upper, ['upper'], field('upper'))) {
    out.upper = {};
    UPPER_FIELDS.forEach(k => {
      const v = s.upper[k];
      if (v !== undefined && check.number(v, ['upper', k], field('upperField'), k === 'gap' ? 0 : 1, MAX_MM))
        out.upper[k] = v;
    });
  }
  const counters = { base: 0, upper: 0 };
  normalizeRows(s, [], counters, check, out);
  if (s.walls !== undefined && check.array(s.walls, ['walls'], field('walls'), 0, MAX_WALLS - 1))
    out.walls = s.walls.map((w, k) => {
      const path = ['walls', k];
      if (!check.object(w, path, field('wall', { n: k + 2 }))) return null;
      const wall = { corner: normalizeCorner(w.corner, [...path, 'corner'], k + 1, check) };
      normalizeRows(w, path, counters, check, wall);
      return wall;
    });
  return out;
}

/** @param {import('../../types.js').Project} project */
export const validateKitchen = project => runValidation(project, normalizeKitchen);
