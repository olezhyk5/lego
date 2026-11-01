import { runValidation } from '../../validate.js';
import { MODULE_TYPES, MODULE_COUNT, WORKTOP_SIDES } from './constants.js';

// Межі навмисно широкі: це перевірка формату, а не конструкції (її робить check.* у layout)
const MAX_MM = 10000;
const MAX_SMALL_MM = 1000; // ніжки, виступи стільниці
const MAX_MODULES = 30;

const field = (name, params) => ({ key: `validate.field.${name}`, params });

/** @param {import('../../validate.js').Checker} check */
function normalizeModule(m, i, check) {
  const path = ['modules', i];
  const p = { n: i + 1 };
  if (!check.object(m, path, field('module', p))) return null;
  const out = {};
  if (check.number(m.width, [...path, 'width'], field('moduleWidth', p), 1, MAX_MM)) out.width = m.width;
  if (check.oneOf(m.type, MODULE_TYPES, [...path, 'type'], field('moduleType', p))) out.type = m.type;
  const range = MODULE_COUNT[m.type];
  if (range && check.integer(m.count, [...path, 'count'], field('moduleCount', p), range[0], range[1]))
    out.count = m.count;
  return out;
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
  }
  if (check.array(s.modules, ['modules'], field('modules'), 1, MAX_MODULES))
    out.modules = s.modules.map((m, i) => normalizeModule(m, i, check));
  return out;
}

/** @param {import('../../types.js').Project} project */
export const validateKitchen = project => runValidation(project, normalizeKitchen);
