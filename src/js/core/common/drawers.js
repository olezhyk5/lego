import { round } from '../../utils/helpers.js';
import { msg } from './msg.js';

// Ящики на напрямних — спільне для типів з ящиками. Межі стартові: погодити з технологом.
export const DRAWER_DEPTH_GAP = 50; // ящик коротший за глибину корпусу, мм
const MIN_DEPTH = 250; // коротших напрямних не буває
const MIN_FRONT_W = 200;
const MAX_FRONT_W = 1000; // ширше — дно прогинається, напрямні не тримають

// Глибина ящика в корпусі глибиною D
export const drawerDepth = D => D - DRAWER_DEPTH_GAP;

/**
 * Попередження для ящиків однієї зони / модуля
 * @param {{ name: import('../types.js').Msg, frontW: number, depth: number }} p
 * @returns {import('../types.js').Msg[]}
 */
export function drawerWarnings({ name, frontW, depth }) {
  const out = [];
  if (depth < MIN_DEPTH) out.push(msg('check.drawerShallow', { name, d: round(depth), min: MIN_DEPTH }));
  if (frontW < MIN_FRONT_W) out.push(msg('check.drawerNarrow', { name, w: round(frontW), min: MIN_FRONT_W }));
  if (frontW > MAX_FRONT_W) out.push(msg('check.drawerWide', { name, w: round(frontW), max: MAX_FRONT_W }));
  return out;
}
