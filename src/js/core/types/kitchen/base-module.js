import { T, GAP } from '../../../config/constants.js';
import { round } from '../../../utils/helpers.js';
import { msg } from '../../common/msg.js';
import { drawerWarnings, drawerDepth } from '../../common/drawers.js';
import { LEG, legRows } from '../../common/legs.js';
import { MODULE_COUNT, DEFAULT_COUNT, SINK_TWO_DOORS_FROM, TALL_TYPES, DOOR_MAX_W } from './constants.js';

export const SHELF_MAX_SPAN = 800; // проліт полиці з ДСП 16 без прогину, мм
const LEG_SIDE_INSET = 40; // крайні ряди ніжок — від боків модуля, мм

// Петель на двері за висотою, мм (пороги погодити з технологом)
export const hingesFor = h => (h <= 1000 ? 2 : h <= 1600 ? 3 : 4);

// Висота фасаду шухляди при cnt шухлядах на висоту h (зазори зверху, знизу й між ними)
export const drawerFront = (h, cnt) => (h - (cnt + 1) * GAP) / cnt;

// Кількість у модулі в межах MODULE_COUNT; під мийку — двері за шириною
export function moduleCount(m, w) {
  if (m.type === 'sink') return w >= SINK_TWO_DOORS_FROM ? 2 : 1;
  const [min, max] = MODULE_COUNT[m.type] || [0, 0];
  const n = Number.isInteger(m.count) ? m.count : DEFAULT_COUNT[m.type] || 0;
  return Math.max(min, Math.min(max, n));
}

// Ряди ніжок модуля шириною w від x (ліві краї ніжок): крайні — на LEG_SIDE_INSET від боків, проміжні — legRows
export const legColumns = (x, w) => legRows([x + LEG_SIDE_INSET, x + w - LEG_SIDE_INSET - LEG]);

// Ніша під посудомийку: без корпусу й ніжок
export const isNiche = m => m.type === 'dishwasher';

// Високий модуль (пенал, холодильник)
export const isTall = m => TALL_TYPES.includes(m.type);

/**
 * Нижній модуль у координатах стіни.
 * @param {any} s проєкт
 * @param {any} m модуль
 * @param {{ x: number, i: number, no: number, freeL: boolean, freeR: boolean, y0: number, Hin: number,
 *   errs: any[], warns: any[], state: { dishwashers: number } }} ctx
 */
export function layoutBaseModule(s, m, { x, no, freeL, freeR, y0, Hin, errs, warns, state }) {
  const name = msg('module.name', { n: no });
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
  // ніша на вільному краю ряду: додаткова боковина назовні (ширина ніші не змінюється), щоб стільниця не висіла
  const sideL = isNiche(m) && freeL;
  const sideR = isNiche(m) && freeR;
  const nicheX = x + (sideL ? T : 0);
  const endSides = [...(sideL ? [x] : []), ...(sideR ? [nicheX + w] : [])];
  if (m.type === 'dishwasher') {
    fronts.push({ key: 'part.dishwasherFront', x: nicheX + GAP, y: y0 + GAP, w: w - 2 * GAP, h: s.H - 2 * GAP });
    if (++state.dishwashers > 1) warns.push(msg('check.dishwasherRepeat', { name }));
  }
  if (m.type === 'sink' && w < 450) warns.push(msg('check.sinkNarrow', { name, w: round(w) }));
  // полиці рівномірно між дном і царгами: у модулі з дверима — одна, у відкритому — cnt
  const nShelves = m.type === 'doors' ? 1 : m.type === 'open' ? cnt : 0;
  const gap = (Hin - nShelves * T) / (nShelves + 1);
  const shelves = Array.from({ length: nShelves }, (_, k) => y0 + T + gap * (k + 1) + T * k);
  if (nShelves && w - 2 * T > SHELF_MAX_SPAN) warns.push(msg('check.shelfSag', { name, w: round(w - 2 * T) }));
  const legs = s.legs > 0 && !isNiche(m) ? legColumns(x, w) : [];
  const outerW = w + endSides.length * T;
  const niche = isNiche(m) ? { x: nicheX, w } : null;
  return { i: no - 1, x, w: outerW, type: m.type, cnt, fronts, shelves, legs, niche, endSides, depth: s.D, y0, h: s.H };
}
