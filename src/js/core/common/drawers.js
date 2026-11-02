import { T } from '../../config/constants.js';
import { round } from '../../utils/helpers.js';
import { thickness } from './geometry-builder.js';
import { msg } from './msg.js';

// Шухляди на напрямних — спільне для типів з шухлядами. Межі стартові: погодити з технологом.
export const DRAWER_DEPTH_GAP = 50; // шухляда коротша за глибину корпусу, мм
const MIN_DEPTH = 250; // коротших напрямних не буває
const MAX_DEPTH = 550; // найдовша напрямна стандартного ряду
const DEPTH_STEP = 50; // крок довжин напрямних
const MIN_FRONT_W = 200;
const MAX_FRONT_W = 1000; // ширше — дно прогинається, напрямні не тримають
const RUNNER_GAP = 13; // зазор під напрямну на бік, мм
const RUNNER_H = 45; // висота напрямної (лише для моделі)
const BODY_H_GAP = 40; // стінки корпусу нижчі за фасад
const BODY_BOTTOM_GAP = 20; // дно корпусу вище за низ фасаду

// Глибина шухляди в корпусі глибиною D = довжина напрямної: найближча менша зі стандартного ряду
export const drawerDepth = D =>
  Math.min(Math.max(Math.floor((D - DRAWER_DEPTH_GAP) / DEPTH_STEP) * DEPTH_STEP, 0), MAX_DEPTH);

/**
 * Розміри корпусу шухляди: w — зовнішня ширина, h — висота стінок, depth — глибина
 * @param {number} openingW ширина прорізу між боковинами, мм
 * @param {number} frontH висота фасаду, мм
 * @param {number} D глибина корпусу меблів, мм
 */
export const drawerBox = (openingW, frontH, D) => ({
  w: Math.max(openingW - 2 * RUNNER_GAP, 2 * T),
  h: Math.max(frontH - BODY_H_GAP, 0),
  depth: drawerDepth(D),
});

/**
 * Плити корпусу й напрямні q однакових шухляд. Передня й задня стінки — між боковинами, дно з ДВП — під стінками.
 * @param {import('./parts-builder.js').PartsBuilder} P
 * @param {ReturnType<typeof drawerBox>} box
 * @param {number} q
 */
export function addDrawerParts(P, { w, h, depth }, q) {
  P.panel('part.drawerSide', depth, h, 2 * q);
  P.panel('part.drawerWall', w - 2 * T, h, 2 * q);
  P.panel('part.drawerBottom', w, depth, q, 'hardboard');
  P.item('part.runner', msg('itemSize.runner', { l: depth }), q); // пара на шухляду
}

/**
 * Корпус і напрямні однієї шухляди в моделі
 * @param {import('./geometry-builder.js').GeometryBuilder} G
 * @param {ReturnType<typeof drawerBox>} box
 * @param {number} x лівий край прорізу
 * @param {number} y низ фасаду
 * @param {number} zFront передня площина корпусу шухляди (задня площина фасаду)
 */
export function addDrawerGeometry(G, { w, h, depth }, x, y, zFront) {
  const bottomT = thickness('hardboard');
  const left = x + RUNNER_GAP;
  const z = zFront - depth;
  const bottomY = y + BODY_BOTTOM_GAP;
  const wallY = bottomY + bottomT;
  G.panel('part.drawerBottom', 'back', left, bottomY, z, w, bottomT, depth, 'hardboard');
  G.panel('part.drawerSide', 'wood', left, wallY, z, T, h, depth);
  G.panel('part.drawerSide', 'wood', left + w - T, wallY, z, T, h, depth);
  G.panel('part.drawerWall', 'wood', left + T, wallY, z, w - 2 * T, h, T);
  G.panel('part.drawerWall', 'wood', left + T, wallY, zFront - T, w - 2 * T, h, T);
  const runnerH = Math.min(RUNNER_H, h);
  const runnerY = wallY + (h - runnerH) / 2;
  G.hardware('part.runner', 'handle', x, runnerY, z, RUNNER_GAP, runnerH, depth);
  G.hardware('part.runner', 'handle', left + w, runnerY, z, RUNNER_GAP, runnerH, depth);
}

/**
 * Попередження для шухляд однієї зони / модуля
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
