import { T } from '../../../config/constants.js';
import { MATERIALS } from '../../../config/materials.js';
import { round } from '../../../utils/helpers.js';
import { msg } from '../../common/msg.js';
import { legsLowWarning } from '../../common/legs.js';
import { WORKTOP_SIDES, DEFAULT_WORKTOP, PLINTH_SETBACK } from './constants.js';
import { layoutBaseModule, isTall } from './base-module.js';
import { layoutTall } from './tall.js';
import { layoutFridge } from './fridge.js';
import { layoutUppers, upperOf } from './upper.js';
import { layoutCorner, cornerPass } from './corner.js';
import { runsOf, placements, placeRect } from './walls.js';

export { drawerFront, moduleCount, legColumns, isNiche, isTall } from './base-module.js';
export { upperOf } from './upper.js';

const COUNTER_H = [850, 950]; // зручна висота робочої поверхні, мм

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

// Товщина стільниці: немає поля або не додатне число → типова з матеріалу
export function worktopThickness(s) {
  const v = Number(s.worktop?.t);
  return Number.isFinite(v) && v > 0 ? v : MATERIALS.worktop.t;
}

// Шматки стільниці стіни: високі модулі її розривають; наступна стіна впирається в стільницю попередньої.
function worktopsOf({ modules, corner, start, end, prevCorner, first, last }, wt) {
  const out = [];
  let open = prevCorner && (modules.length || prevCorner.type !== 'blind') ? { x0: wt.d, x1: start } : null;
  const close = () => {
    if (open && open.x1 > open.x0) {
      const left = first && open.x0 === 0 ? wt.left : 0;
      const right = last && !corner && open.x1 === end ? wt.right : 0;
      out.push({ x: open.x0 - left, w: open.x1 - open.x0 + left + right, d: wt.d, t: wt.t });
    }
    open = null;
  };
  modules.forEach(m => {
    if (isTall(m)) return close();
    if (!open) open = { x0: m.x, x1: m.x };
    open.x1 = m.x + m.w;
  });
  if (corner) {
    if (!open) open = { x0: corner.x, x1: end };
    open.x1 = end;
  }
  close();
  return out;
}

// Цокольні планки стіни: одна площина = суцільна планка; модуль іншої глибини — окрема.
function plinthsOf({ modules, corner, start, end, prevCorner }, s) {
  const front = s.D - PLINTH_SETBACK;
  const spans = [];
  if (prevCorner) spans.push({ x0: front, x1: start, depth: s.D });
  modules.forEach(m => {
    const x0 = m.x + (m.endSides.includes(m.x) ? T : 0);
    const x1 = m.x + m.w - (m.endSides.includes(m.x + m.w - T) ? T : 0);
    spans.push({ x0, x1, depth: m.depth });
  });
  if (corner) spans.push({ x0: corner.x, x1: end - front + T, depth: s.D });
  const out = [];
  spans
    .filter(p => p.x1 > p.x0)
    .forEach(p => {
      const prev = out[out.length - 1];
      if (prev && prev.depth === p.depth && Math.abs(prev.x + prev.w - p.x0) < 0.01) prev.w = p.x1 - prev.x;
      else out.push({ x: p.x0, w: p.x1 - p.x0, depth: p.depth });
    });
  return out;
}

// Межі стіни в її координатах: для габаритів і розмірних ліній
function extentOf({ modules, corner, uppers, worktops, end, start }) {
  const xs = [...worktops.flatMap(p => [p.x, p.x + p.w]), start, end];
  const ds = [...worktops.map(p => p.d), ...[...modules, ...uppers].map(m => m.depth + T)];
  if (corner) ds.push(corner.type === 'lShape' ? corner.b : corner.depth + T);
  uppers.forEach(m => xs.push(m.x, m.x + m.w));
  return { x0: Math.min(...xs), x1: Math.max(...xs), d: Math.max(...ds, 0) };
}

/**
 * Стіни, модулі, фасади, стільниці + помилки/попередження. Усе — у координатах своєї стіни:
 * x — вздовж стіни, y — від підлоги, z — від стіни; wall.place кладе стіну в модель (walls.js).
 * @param {import('../../types.js').Project} s
 */
export function computeLayout(s) {
  const errs = [],
    warns = [];
  if (s.H < 300 || s.D < 200) errs.push(msg('check.kitchenTooSmall'));
  const legsLow = legsLowWarning(s.legs);
  if (legsLow) warns.push(legsLow);
  const y0 = s.legs; // низ модулів
  const Hin = s.H - 2 * T; // між дном і царгами
  const ov = worktopOf(s);
  const t = worktopThickness(s);
  const wt = { ...ov, t, d: s.D + ov.front };
  const up = upperOf(s);
  const upperY0 = y0 + s.H + t + up.gap;
  const top = upperY0 + up.H; // лінія верху кухні: верх верхніх модулів і високих
  const state = { dishwashers: 0, uppers: 0 };
  const runs = runsOf(s);
  let no = 0;
  let corners = 0;

  const drafts = runs.map((run, k) => {
    const prevCorner = run.corner;
    const nextCorner = runs[k + 1]?.corner;
    const start = prevCorner ? cornerPass(s, prevCorner) : 0;
    let x = start;
    const modules = run.modules.map((m, i) => {
      no++;
      const common = { x, no, y0, top, errs, warns };
      const out =
        m.type === 'tall'
          ? layoutTall(s, m, common)
          : m.type === 'fridge'
            ? layoutFridge(s, m, common)
            : layoutBaseModule(s, m, {
                ...common,
                i,
                Hin,
                state,
                freeL: i === 0 && !prevCorner,
                freeR: i === run.modules.length - 1 && !nextCorner,
              });
      x += out.w;
      return out;
    });
    const corner = nextCorner
      ? layoutCorner(s, nextCorner, {
          x,
          y0,
          no: ++corners,
          nextEmpty: !runs[k + 1].modules.length,
          errs,
          warns,
        })
      : null;
    const end = corner ? x + corner.len : x;
    const parts = { modules, corner, start, end, prevCorner, first: k === 0, last: k === runs.length - 1 };
    const worktops = worktopsOf(parts, wt);
    if (worktops.some(p => p.w > MATERIALS.worktop.sheet.a))
      worktops
        .filter(p => p.w > MATERIALS.worktop.sheet.a)
        .forEach(p => warns.push(msg('check.worktopJoin', { len: round(p.w), max: MATERIALS.worktop.sheet.a })));
    const uppers = layoutUppers(run.uppers, {
      start: prevCorner ? up.D + T : 0,
      end,
      blocked: modules.filter(isTall),
      y0: upperY0,
      up,
      state,
      errs,
      warns,
    });
    const wall = { k, modules, corner, uppers, worktops, plinths: plinthsOf(parts, s), start, end };
    return { ...wall, extent: extentOf(wall) };
  });

  const placed = placements(drafts.map(w => w.end));
  const walls = drafts.map((w, k) => ({ ...w, place: placed[k] }));

  if (wt.d > MATERIALS.worktop.sheet.b)
    warns.push(msg('check.worktopDeep', { d: round(wt.d), max: MATERIALS.worktop.sheet.b }));
  const counter = y0 + s.H + t;
  if (counter < COUNTER_H[0] || counter > COUNTER_H[1])
    warns.push(msg('check.counterHeight', { h: round(counter), min: COUNTER_H[0], max: COUNTER_H[1] }));

  const allModules = walls.flatMap(w => w.modules);
  const allUppers = walls.flatMap(w => w.uppers);
  const Htot = Math.max(counter, ...[...allModules, ...allUppers].map(m => m.y0 + m.h));
  const rects = walls.map(w =>
    placeRect(w.place, { x: w.extent.x0, z: 0, w: w.extent.x1 - w.extent.x0, d: w.extent.d }),
  );
  const span = (lo, size) => Math.max(...rects.map(r => r[lo] + r[size])) - Math.min(...rects.map(r => r[lo]));
  return {
    walls,
    modules: allModules,
    uppers: allUppers,
    corners: walls.flatMap(w => (w.corner ? [w.corner] : [])),
    W: walls[0].end,
    Htot,
    top,
    upper: up,
    y0,
    Hin,
    worktopSpec: wt,
    bounds: { W: span('x', 'w'), H: Htot, D: span('z', 'd') },
    errs,
    warns,
  };
}
