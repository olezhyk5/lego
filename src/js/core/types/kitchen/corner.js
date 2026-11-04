import { T, GAP } from '../../../config/constants.js';
import { round } from '../../../utils/helpers.js';
import { msg } from '../../common/msg.js';
import { SHELF_MAX_SPAN, legColumns } from './base-module.js';
import { CORNER_COUNT, DEFAULT_CORNER } from './constants.js';

const MIN_DOOR = 150;
export const SHELF_SETBACK = 20; // полиці коротші за глибину модуля

const cornerCount = c => {
  const n = Number.isInteger(c.count) ? c.count : DEFAULT_CORNER[c.type].count;
  return Math.max(CORNER_COUNT[0], Math.min(CORNER_COUNT[1], n));
};

/** Де на наступній стіні починаються її нижні модулі: кутовий модуль займає початок стіни */
export const cornerPass = (s, c) => (c.type === 'blind' ? s.D + T + (c.filler ?? DEFAULT_CORNER.blind.filler) : c.b);

const shelvesOf = (y0, H, n) => {
  const gap = (H - 2 * T - n * T) / (n + 1);
  return Array.from({ length: n }, (_, k) => y0 + T + gap * (k + 1) + T * k);
};

// Глухий: звичайний корпус на кінці стіни, частину закриває сусідня стіна; двері — лише на видимій частині.
// Доборні планки (Г-подібний добір) не дають дверям зачепити сусідні фасади й ручки.
function blindCorner(s, c, { x, y0, name, errs, warns }) {
  const w = c.width;
  const filler = c.filler ?? DEFAULT_CORNER.blind.filler;
  const doorW = w - s.D - T - filler - 2 * GAP;
  if (doorW < MIN_DOOR) errs.push(msg('check.cornerNarrow', { name, w: round(doorW), min: MIN_DOOR }));
  if (w - 2 * T > SHELF_MAX_SPAN && cornerCount(c) > 0)
    warns.push(msg('check.shelfSag', { name, w: round(w - 2 * T) }));
  const end = x + w;
  return {
    type: 'blind',
    x,
    w,
    len: w,
    cnt: cornerCount(c),
    fronts: [{ key: 'part.door', x: x + GAP, y: y0 + GAP, w: doorW, h: s.H - 2 * GAP }],
    shelves: shelvesOf(y0, s.H, cornerCount(c)),
    legs: s.legs > 0 ? legColumns(x, w) : [],
    niche: null,
    endSides: [],
    depth: s.D,
    y0,
    h: s.H,
    // у координатах цієї стіни: планка на її фасаді й планка на фасаді сусідньої
    fillers: [
      { x: end - s.D - T - filler, z: s.D, w: filler + T, d: T },
      { x: end - s.D - T, z: s.D + T, w: T, d: filler },
    ],
  };
}

// Г-подібний: корпус по обох стінах, a — уздовж цієї, b — уздовж наступної; двері-книжка.
// Дно й полиці — прямокутні заготовки a × b з вирізом; у специфікації — розмір заготовки.
function lShapeCorner(s, c, { x, y0, name, errs }) {
  const { a, b } = c;
  const end = x + a;
  const doorA = a - s.D - T - 2 * GAP;
  const doorB = b - s.D - 2 * GAP;
  const min = Math.min(doorA, doorB);
  if (min < MIN_DOOR) errs.push(msg('check.cornerNarrow', { name, w: round(min), min: MIN_DOOR }));
  return {
    type: 'lShape',
    x,
    len: a,
    a,
    b,
    cnt: cornerCount(c),
    depth: s.D,
    y0,
    h: s.H,
    end,
    shelves: shelvesOf(y0, s.H, cornerCount(c)),
    doors: [
      { x: x + GAP, z: s.D, w: doorA, d: T },
      { x: end - s.D - T, z: s.D + GAP, w: T, d: doorB },
    ],
    doorH: s.H - 2 * GAP,
  };
}

/**
 * Кутовий модуль на кінці стіни (у її координатах); наступна стіна починається за ним.
 * @param {any} s проєкт
 * @param {any} c стик
 * @param {{ x: number, no: number, y0: number, nextEmpty: boolean, errs: any[], warns: any[] }} ctx
 */
export function layoutCorner(s, c, ctx) {
  const name = msg('corner.name', { n: ctx.no });
  if (c.type === 'blind') {
    if (ctx.nextEmpty) ctx.warns.push(msg('check.blindNoNeighbour', { name }));
    return { ...blindCorner(s, c, { ...ctx, name }), no: ctx.no };
  }
  return { ...lShapeCorner(s, c, { ...ctx, name }), no: ctx.no };
}
