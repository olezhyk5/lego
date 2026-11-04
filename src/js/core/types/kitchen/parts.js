import { T } from '../../../config/constants.js';
import { round } from '../../../utils/helpers.js';
import { partsBuilder } from '../../common/parts-builder.js';
import { msg } from '../../common/msg.js';
import { drawerBox, addDrawerParts } from '../../common/drawers.js';
import { legCount } from '../../common/legs.js';
import { isNiche, isTall, hingesFor } from './base-module.js';
import { RAIL_W } from './constants.js';
import { SHELF_SETBACK } from './corner.js';
import { L_SHAPE_LEGS } from './corner-geometry.js';

const HANGERS = 2; // навіси на верхній модуль

const doorsHinges = fronts => fronts.filter(f => f.key === 'part.door').reduce((n, f) => n + hingesFor(f.h), 0);

// Г-подібний модуль: дно й полиці — заготовки з вирізом, царги й задні стінки — по обох стінах
function addLShapeParts(P, s, c) {
  P.panel('part.side', s.H, s.D, 2);
  const blankA = c.a - T;
  const blankB = c.b - T;
  P.panel('part.bottom', blankA, blankB, 1);
  P.panel('part.shelf', blankA, blankB, c.shelves.length);
  P.panel('part.rail', c.a - T, RAIL_W, 1);
  P.panel('part.rail', c.b - T - RAIL_W, RAIL_W, 1);
  P.panel('part.rail', c.a - T - s.D, RAIL_W, 1);
  P.panel('part.rail', c.b - T - s.D + RAIL_W, RAIL_W, 1);
  P.panel('part.back', s.H - 4, c.a - 4, 1, 'hardboard');
  P.panel('part.back', s.H - 4, c.b - 4, 1, 'hardboard');
  c.doors.forEach(d => P.panel('part.door', Math.max(d.w, d.d), c.doorH, 1));
}

// Корпус пенала або холодильника: боковини від ніжок до верху, дно, кришка, полиці між зонами
function addTallCarcass(P, m) {
  const inner = m.w - 2 * T;
  P.panel('part.side', m.h, m.depth, 2);
  P.panel('part.bottom', inner, m.depth, 1);
  P.panel('part.top', inner, m.depth, 1);
  P.panel('part.zoneShelf', inner, m.depth, m.type === 'tall' ? m.dividers.length : m.yShelf === null ? 0 : 1);
}

function addUpperParts(P, m, up) {
  if (m.type === 'gap') return;
  const inner = m.w - 2 * T;
  P.panel('part.side', up.H, up.D, 2);
  P.panel('part.bottom', inner, up.D, 1);
  P.panel('part.top', inner, up.D, 1);
  P.panel('part.shelf', inner, up.D - SHELF_SETBACK, m.shelves.length);
  m.fronts.forEach(f => P.panel(f.key, f.w, f.h, 1));
  P.panel('part.back', up.H - 4, m.w - 4, 1, 'hardboard');
}

// Специфікація кухні (формат — PartsList у core/types.js).
// Кожна плита має рівно один бокс у geometry.js (перевіряє core/registry.test.js).
export function partsList(s, L) {
  const P = partsBuilder();
  const inner = m => m.w - 2 * T;
  const blinds = L.corners.filter(c => c.type === 'blind');
  const lShapes = L.corners.filter(c => c.type === 'lShape');
  const cabinets = [...L.modules.filter(m => !isNiche(m) && !isTall(m)), ...blinds];
  const withFronts = [...L.modules, ...blinds];
  cabinets.forEach(m => {
    P.panel('part.side', s.H, s.D, 2);
    P.panel('part.bottom', inner(m), s.D, 1);
    P.panel('part.rail', inner(m), RAIL_W, 2);
  });
  L.modules.filter(isTall).forEach(m => addTallCarcass(P, m));
  // додаткові боковини ніші: від підлоги до стільниці
  L.modules.forEach(m => P.panel('part.side', s.legs + s.H, s.D, m.endSides.length));
  withFronts.forEach(m => P.panel('part.shelf', inner(m), m.depth - SHELF_SETBACK, m.shelves.length));
  withFronts.forEach(m => m.fronts.forEach(f => P.panel(f.key, f.w, f.h, 1)));
  withFronts.forEach(m =>
    m.fronts
      .filter(f => f.key === 'part.drawerFront')
      .forEach(f => addDrawerParts(P, drawerBox(inner(m), f.h, m.depth), 1)),
  );
  blinds.forEach(c => c.fillers.forEach(f => P.panel('part.filler', Math.max(f.w, f.d), s.H, 1)));
  lShapes.forEach(c => addLShapeParts(P, s, c));
  if (s.legs > 0) L.walls.forEach(w => w.plinths.forEach(p => P.panel('part.plinth', p.w, s.legs, 1)));
  L.walls.forEach(w => w.worktops.forEach(p => P.panel('part.worktop', p.w, p.d, 1, 'worktop', p.t)));
  cabinets.forEach(m => P.panel('part.back', s.H - 4, m.w - 4, 1, 'hardboard'));
  L.modules.filter(m => m.type === 'tall').forEach(m => P.panel('part.back', m.h - 4, m.w - 4, 1, 'hardboard'));
  L.uppers.forEach(m => addUpperParts(P, m, L.upper));

  withFronts.forEach(m => {
    P.item('part.handle', msg('itemSize.handle'), m.fronts.length);
    P.item('part.hinge', msg('itemSize.hinge'), doorsHinges(m.fronts));
    if (m.type === 'sink') P.item('part.sink', msg('itemSize.sink', { w: round(m.w) }), 1);
    if (m.type === 'dishwasher') P.item('part.dishwasher', msg('itemSize.dishwasher', { w: round(m.niche.w) }), 1);
    if (m.type === 'fridge')
      P.item(
        'part.fridge',
        msg('itemSize.fridge', { w: round(m.niche.w), h: round(m.niche.h), d: round(m.niche.d) }),
        1,
      );
    (m.appliances || []).forEach(a =>
      P.item(a.key, msg('itemSize.appliance', { w: round(inner(m)), h: round(a.nicheH), d: round(m.depth) }), 1),
    );
  });
  lShapes.forEach(c => {
    P.item('part.handle', msg('itemSize.handle'), 1); // дві дверки-книжка — одна ручка
    P.item('part.hinge', msg('itemSize.hinge'), 2 * hingesFor(c.doorH));
  });
  L.uppers.forEach(m => {
    P.item('part.handle', msg('itemSize.handle'), m.fronts.length);
    P.item('part.hinge', msg('itemSize.hinge'), doorsHinges(m.fronts));
    if (m.type !== 'gap') P.item('part.hanger', msg('itemSize.hanger'), HANGERS);
  });
  const legs = withFronts.reduce((n, m) => n + legCount(m.legs), 0) + (s.legs > 0 ? lShapes.length * L_SHAPE_LEGS : 0);
  if (legs) P.item('part.leg', msg('itemSize.leg', { h: round(s.legs) }), legs);
  return P.result();
}

function moduleMsg(m) {
  const f = m.fronts[0];
  switch (m.type) {
    case 'doors':
      return msg('describe.moduleDoors', { cnt: m.cnt, w: round(f.w), h: round(f.h) });
    case 'drawers':
      return msg('describe.moduleDrawers', { cnt: m.cnt, front: round(f.h) });
    case 'sink':
      return msg('describe.moduleSink', { cnt: m.cnt });
    case 'dishwasher':
      return msg('describe.moduleDishwasher', { w: round(f.w), h: round(f.h) });
    case 'open':
      return msg('describe.moduleOpen', { cnt: m.cnt });
    case 'tall':
      return msg('describe.moduleTall', { h: round(m.h), n: m.zones.length });
    case 'fridge':
      return msg('describe.moduleFridge', { w: round(m.niche.w), h: round(m.niche.h), d: round(m.niche.d) });
  }
  return null;
}

// Опис модулів: [{key, params, children}]
export function describe(s, L) {
  const rows = L.modules.map(m => ({
    key: 'describe.module',
    params: { n: m.i + 1, w: round(m.w) },
    children: [moduleMsg(m)].filter(Boolean),
  }));
  L.corners.forEach(c =>
    rows.push({
      key: 'describe.corner',
      params: { n: c.no, w: round(c.len) },
      children: [
        c.type === 'blind'
          ? msg('describe.cornerBlind', { w: round(c.fronts[0].w) })
          : msg('describe.cornerLShape', { a: round(c.a), b: round(c.b) }),
      ],
    }),
  );
  L.uppers
    .filter(m => m.type !== 'gap')
    .forEach(m =>
      rows.push({
        key: 'describe.upper',
        params: { n: m.i + 1, w: round(m.w) },
        children: [moduleMsg(m)].filter(Boolean),
      }),
    );
  return rows;
}

// Шапка CSV: [{label, value}]
export function summary(s, L) {
  const wt = L.worktopSpec;
  const rows = [
    {
      label: msg('export.overall'),
      value: `${round(L.bounds.W)} × ${round(L.bounds.H)} × ${round(L.bounds.D)}`,
    },
    { label: msg('export.kitchenCarcass'), value: `${s.H} × ${s.D}` },
    { label: msg('export.legs'), value: s.legs },
    {
      label: msg('export.worktop'),
      value: msg('export.worktopValue', { t: wt.t, front: wt.front, left: wt.left, right: wt.right }),
    },
  ];
  if (L.uppers.length)
    rows.push({
      label: msg('export.upper'),
      value: msg('export.upperValue', { h: L.upper.H, d: L.upper.D, gap: L.upper.gap }),
    });
  return rows;
}
