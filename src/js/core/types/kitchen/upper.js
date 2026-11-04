import { T, GAP } from '../../../config/constants.js';
import { round } from '../../../utils/helpers.js';
import { msg } from '../../common/msg.js';
import { SHELF_MAX_SPAN } from './base-module.js';
import { DEFAULT_COUNT, DEFAULT_UPPER, DOOR_MAX_W, UPPER_COUNT, UPPER_FIELDS } from './constants.js';

const HANDLE_LOW = 48; // ручка над низом дверей: корпус вище за очі

/** Параметри верхніх модулів: немає поля або не додатне (відступ — від'ємне) → типове */
export function upperOf(s) {
  const src = s.upper && typeof s.upper === 'object' ? s.upper : {};
  return Object.fromEntries(
    UPPER_FIELDS.map(k => {
      const v = Number(src[k]);
      const ok = Number.isFinite(v) && (k === 'gap' ? v >= 0 : v > 0);
      return [k, ok ? v : DEFAULT_UPPER[k]];
    }),
  );
}

function upperCount(m) {
  const range = UPPER_COUNT[m.type];
  if (!range) return 0;
  const n = Number.isInteger(m.count) ? m.count : DEFAULT_COUNT[m.type];
  return Math.max(range[0], Math.min(range[1], n));
}

function upperModule(m, { x, w, no, y0, up, warns }) {
  const name = msg('module.upperName', { n: no });
  const cnt = upperCount(m);
  const fronts = [];
  if (m.type === 'doors') {
    const dw = (w - 2 * GAP - (cnt - 1) * GAP) / cnt;
    for (let k = 0; k < cnt; k++)
      fronts.push({
        key: 'part.door',
        x: x + GAP + k * (dw + GAP),
        y: y0 + GAP,
        w: dw,
        h: up.H - 2 * GAP,
        handleY: y0 + HANDLE_LOW,
      });
    if (dw > DOOR_MAX_W) warns.push(msg('check.doorWide', { name, w: round(dw) }));
  }
  const nShelves = m.type === 'doors' ? 1 : m.type === 'open' ? cnt : 0;
  const gap = (up.H - 2 * T - nShelves * T) / (nShelves + 1);
  const shelves = Array.from({ length: nShelves }, (_, k) => y0 + T + gap * (k + 1) + T * k);
  if (nShelves && w - 2 * T > SHELF_MAX_SPAN) warns.push(msg('check.shelfSag', { name, w: round(w - 2 * T) }));
  return { i: no - 1, x, w, type: m.type, cnt, fronts, shelves, depth: up.D, y0, h: up.H };
}

/**
 * Верхній ряд стіни: зліва направо від start, високі модулі оминає (наступний модуль стає за високим).
 * @param {any[]} list верхні модулі стіни
 * @param {{ start: number, end: number, blocked: { x: number, w: number }[], y0: number,
 *   up: ReturnType<typeof upperOf>, state: { uppers: number }, errs: any[], warns: any[] }} ctx
 */
export function layoutUppers(list, { start, end, blocked, y0, up, state, errs, warns }) {
  let cursor = start;
  return list.map(m => {
    const no = ++state.uppers;
    const w = +m.width || 0;
    if (m.type !== 'gap' && w < 150)
      errs.push(msg('check.moduleNarrow', { name: msg('module.upperName', { n: no }), w: round(w) }));
    blocked.forEach(b => {
      if (cursor < b.x + b.w && cursor + w > b.x) cursor = b.x + b.w;
    });
    const out = upperModule(m, { x: cursor, w, no, y0, up, warns });
    if (m.type !== 'gap' && cursor + w > end + 1)
      warns.push(
        msg('check.upperOverflow', { name: msg('module.upperName', { n: no }), over: round(cursor + w - end) }),
      );
    cursor += w;
    return out;
  });
}
