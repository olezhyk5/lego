import { T, GAP } from '../../../config/constants.js';
import { MATERIALS } from '../../../config/materials.js';
import { round } from '../../../utils/helpers.js';
import { msg } from '../../common/msg.js';
import { drawerWarnings, drawerDepth } from '../../common/drawers.js';
import { LEG, legRows, legsLowWarning } from '../../common/legs.js';
import { MODULE_COUNT, DEFAULT_COUNT, WORKTOP_SIDES, DEFAULT_WORKTOP, SINK_TWO_DOORS_FROM } from './constants.js';

const SHELF_MAX_SPAN = 800; // проліт полиці з ДСП 16 без прогину, мм
const DOOR_MAX_W = 600;
const COUNTER_H = [850, 950]; // зручна висота робочої поверхні, мм

// Висота фасаду ящика при cnt ящиках на висоту h (зазори зверху, знизу й між ними)
export const drawerFront = (h, cnt) => (h - (cnt + 1) * GAP) / cnt;

// Виступи стільниці: немає поля → типові; невідомі / від'ємні / нечислові → 0
export function worktopOf(s) {
  const src = s.worktop && typeof s.worktop === 'object' ? s.worktop : DEFAULT_WORKTOP;
  return Object.fromEntries(
    WORKTOP_SIDES.map(k => {
      const v = Number(src[k]);
      return [k, Number.isFinite(v) && v > 0 ? v : 0];
    }),
  );
}

// Кількість у модулі в межах MODULE_COUNT; під мийку — двері за шириною
export function moduleCount(m, w) {
  if (m.type === 'sink') return w >= SINK_TWO_DOORS_FROM ? 2 : 1;
  const [min, max] = MODULE_COUNT[m.type] || [0, 0];
  const n = Number.isInteger(m.count) ? m.count : DEFAULT_COUNT[m.type] || 0;
  return Math.max(min, Math.min(max, n));
}

const LEG_SIDE_INSET = 40; // крайні ряди ніжок — від боків модуля, мм

// Ряди ніжок модуля шириною w від x (ліві краї ніжок): крайні — на LEG_SIDE_INSET від боків, проміжні — legRows
export const legColumns = (x, w) => legRows([x + LEG_SIDE_INSET, x + w - LEG_SIDE_INSET - LEG]);

// Модулі, фасади, полиці, стільниця + помилки/попередження.
// Координати: x — від лівого краю першого модуля, y — від підлоги, z — від задньої площини модулів.
export function computeLayout(s) {
  const errs = [],
    warns = [];
  if (s.H < 300 || s.D < 200) errs.push(msg('check.kitchenTooSmall'));
  const legsLow = legsLowWarning(s.legs);
  if (legsLow) warns.push(legsLow);
  const y0 = s.legs; // низ модулів
  const Hin = s.H - 2 * T; // між дном і царгами
  let x = 0;
  const modules = s.modules.map((m, i) => {
    const name = msg('module.name', { n: i + 1 });
    const w = +m.width || 0;
    if (w < 150) errs.push(msg('check.moduleNarrow', { name, w: round(w) }));
    const cnt = moduleCount(m, w);
    const fronts = [];
    if (m.type === 'doors' || m.type === 'sink') {
      const dw = (w - 2 * GAP - (cnt - 1) * GAP) / cnt;
      for (let k = 0; k < cnt; k++)
        fronts.push({ key: 'part.door', x: x + GAP + k * (dw + GAP), y: y0 + GAP, w: dw, h: s.H - 2 * GAP });
      if (dw > DOOR_MAX_W) warns.push(msg('check.doorWide', { name, w: round(dw) }));
    }
    if (m.type === 'drawers') {
      const fh = drawerFront(s.H, cnt);
      for (let k = 0; k < cnt; k++)
        fronts.push({ key: 'part.drawerFront', x: x + GAP, y: y0 + GAP + k * (fh + GAP), w: w - 2 * GAP, h: fh });
      if (fh < 100) warns.push(msg('check.drawerSmall', { name, h: round(fh) }));
      warns.push(...drawerWarnings({ name, frontW: w - 2 * GAP, depth: drawerDepth(s.D) }));
    }
    if (m.type === 'sink' && w < 450) warns.push(msg('check.sinkNarrow', { name, w: round(w) }));
    // полиці рівномірно між дном і царгами: у модулі з дверима — одна, у відкритому — cnt
    const nShelves = m.type === 'doors' ? 1 : m.type === 'open' ? cnt : 0;
    const gap = (Hin - nShelves * T) / (nShelves + 1);
    const shelves = Array.from({ length: nShelves }, (_, k) => y0 + T + gap * (k + 1) + T * k);
    if (nShelves && w - 2 * T > SHELF_MAX_SPAN) warns.push(msg('check.shelfSag', { name, w: round(w - 2 * T) }));
    const legs = s.legs > 0 ? legColumns(x, w) : [];
    const out = { i, x, w, type: m.type, cnt, fronts, shelves, legs };
    x += w;
    return out;
  });

  const W = x;
  const ov = worktopOf(s);
  const wt = { ...ov, t: MATERIALS.worktop.t, x: 0 - ov.left, w: W + ov.left + ov.right, d: s.D + ov.front };
  const sheet = MATERIALS.worktop.sheet;
  if (wt.w > sheet.a) warns.push(msg('check.worktopJoin', { len: round(wt.w), max: sheet.a }));
  if (wt.d > sheet.b) warns.push(msg('check.worktopDeep', { d: round(wt.d), max: sheet.b }));
  const Htot = s.legs + s.H + wt.t;
  if (Htot < COUNTER_H[0] || Htot > COUNTER_H[1])
    warns.push(msg('check.counterHeight', { h: round(Htot), min: COUNTER_H[0], max: COUNTER_H[1] }));

  return { modules, W, Htot, y0, Hin, worktop: wt, bounds: { W: wt.w, H: Htot, D: wt.d }, errs, warns };
}
