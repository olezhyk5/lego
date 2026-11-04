import { T, GAP } from '../../../config/constants.js';
import { isAuto, round } from '../../../utils/helpers.js';
import { msg } from '../../common/msg.js';
import { drawerWarnings, drawerDepth } from '../../common/drawers.js';
import { drawerFront, legColumns, SHELF_MAX_SPAN } from './base-module.js';
import { APPLIANCE_NICHE, DOOR_MAX_W, TALL_ZONE_COUNT, DEFAULT_ZONE_COUNT } from './constants.js';

const HANDLE_Y = 1050; // ручка високих дверей — на зручній висоті, мм
const DRAWERS_MAX_TOP = 1300;
const SHELVES_MIN_GAP = 150;
const ZONE_MIN_H = 60;

// Кількість у зоні пенала в межах типу
function zoneCount(z) {
  const range = TALL_ZONE_COUNT[z.type];
  if (!range) return 0;
  const n = Number.isInteger(z.count) ? z.count : DEFAULT_ZONE_COUNT[z.type];
  return Math.max(range[0], Math.min(range[1], n));
}

function zoneHeights(zones, avail, name, errs) {
  let fixed = 0,
    autos = 0;
  zones.forEach(z => (isAuto(z.height) ? autos++ : (fixed += +z.height || 0)));
  const autoH = autos ? (avail - fixed) / autos : 0;
  if (autos && autoH < ZONE_MIN_H) errs.push(msg('check.heightsOverflow', { name, auto: round(autoH) }));
  if (!autos && Math.abs(fixed - avail) > 1)
    errs.push(msg('check.heightsMismatch', { name, sum: round(fixed), avail: round(avail) }));
  return z => (isAuto(z.height) ? autoH : +z.height || 0);
}

// Фасади однієї зони в межах по висоті lo…hi
function zoneFronts(z, { x, w, lo, hi, name, warns }) {
  if (z.type === 'drawers') {
    const fh = drawerFront(hi - lo + 2 * GAP, z.cnt);
    if (fh < 100) warns.push(msg('check.drawerSmall', { name, h: round(fh) }));
    return Array.from({ length: z.cnt }, (_, k) => ({
      key: 'part.drawerFront',
      x: x + GAP,
      y: lo + k * (fh + GAP),
      w: w - 2 * GAP,
      h: fh,
    }));
  }
  if (z.type !== 'shelves' && z.type !== 'empty') return [];
  const n = w - 2 * GAP > DOOR_MAX_W ? 2 : 1;
  const dw = (w - 2 * GAP - (n - 1) * GAP) / n;
  const handleY = Math.max(lo + 20, Math.min(hi - 60, HANDLE_Y));
  return Array.from({ length: n }, (_, k) => ({
    key: 'part.door',
    x: x + GAP + k * (dw + GAP),
    y: lo,
    w: dw,
    h: hi - lo,
    handleY,
  }));
}

/**
 * Пенал: корпус від ніжок до лінії верху кухні, зони зверху вниз, між зонами — полиця.
 * @param {any} s проєкт
 * @param {any} m модуль
 * @param {{ x: number, no: number, y0: number, top: number, errs: any[], warns: any[] }} ctx
 */
export function layoutTall(s, m, { x, no, y0, top, errs, warns }) {
  const name = msg('module.name', { n: no });
  const w = +m.width || 0;
  if (w < 150) errs.push(msg('check.moduleNarrow', { name, w: round(w) }));
  const inner = w - 2 * T;
  const h = top - y0;
  const heightOf = zoneHeights(m.zones, h - 2 * T - (m.zones.length - 1) * T, name, errs);
  const fronts = [];
  const shelves = [];
  const appliances = [];
  let y = y0 + h - T;
  const zones = m.zones.map((src, j) => {
    const zh = heightOf(src);
    const z = { type: src.type, h: zh, top: y, bottom: y - zh, cnt: zoneCount(src) };
    y = z.bottom - T;
    const zn = msg('module.zoneName', { n: no, z: j + 1 });
    // фасад закриває зону до середини полиць між зонами; крайні — до краю корпусу
    const hi = j === 0 ? y0 + h - GAP : z.top + T / 2 - GAP / 2;
    const lo = j === m.zones.length - 1 ? y0 + GAP : z.bottom - T / 2 + GAP / 2;
    fronts.push(...zoneFronts(z, { x, w, lo, hi, name: zn, warns }));
    if (z.type === 'drawers') {
      warns.push(...drawerWarnings({ name: zn, frontW: w - 2 * GAP, depth: drawerDepth(s.D) }));
      if (z.top > DRAWERS_MAX_TOP) warns.push(msg('check.drawersHigh', { name: zn, top: round(z.top) }));
    }
    if (z.type === 'shelves') {
      const gap = (zh - z.cnt * T) / (z.cnt + 1);
      if (gap < SHELVES_MIN_GAP) warns.push(msg('check.shelvesTight', { name: zn, gap: round(gap) }));
      if (inner > SHELF_MAX_SPAN) warns.push(msg('check.shelfSag', { name: zn, w: round(inner) }));
      for (let k = 0; k < z.cnt; k++) shelves.push(z.bottom + gap * (k + 1) + T * k);
    }
    const need = APPLIANCE_NICHE[z.type];
    if (need) {
      appliances.push({ key: 'part.' + z.type, x: x + GAP, y: lo, w: w - 2 * GAP, h: hi - lo, nicheH: zh });
      if (inner < need.w || zh < need.h || s.D < need.d)
        warns.push(
          msg('check.applianceNiche', {
            name: zn,
            appliance: msg('part.' + z.type),
            w: round(inner),
            h: round(zh),
            d: round(s.D),
            minW: need.w,
            minH: need.h,
            minD: need.d,
          }),
        );
    }
    return z;
  });
  const dividers = zones.slice(0, -1).map(z => z.bottom - T);
  const legs = s.legs > 0 ? legColumns(x, w) : [];
  return {
    i: no - 1,
    x,
    w,
    type: 'tall',
    cnt: zones.length,
    zones,
    dividers,
    appliances,
    fronts,
    shelves,
    legs,
    niche: null,
    endSides: [],
    depth: s.D,
    y0,
    h,
  };
}
