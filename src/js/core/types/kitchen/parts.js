import { T } from '../../../config/constants.js';
import { round } from '../../../utils/helpers.js';
import { partsBuilder } from '../../common/parts-builder.js';
import { msg } from '../../common/msg.js';
import { drawerDepth } from '../../common/drawers.js';
import { legCount } from '../../common/legs.js';
import { RAIL_W } from './constants.js';

const SHELF_SETBACK = 20; // полиці коротші за глибину модуля

// Специфікація кухні (формат — PartsList у core/types.js).
// Кожна плита має рівно один бокс у geometry.js (перевіряє core/registry.test.js).
export function partsList(s, L) {
  const P = partsBuilder();
  const inner = m => m.w - 2 * T;
  L.modules.forEach(m => {
    P.panel('part.side', s.H, s.D, 2);
    P.panel('part.bottom', inner(m), s.D, 1);
    P.panel('part.rail', inner(m), RAIL_W, 2);
  });
  L.modules.forEach(m => P.panel('part.shelf', inner(m), s.D - SHELF_SETBACK, m.shelves.length));
  L.modules.forEach(m => m.fronts.forEach(f => P.panel(f.key, f.w, f.h, 1)));
  if (s.legs > 0) P.panel('part.plinth', L.W, s.legs, 1);
  P.panel('part.worktop', L.worktop.w, L.worktop.d, 1, 'worktop');
  L.modules.forEach(m => P.panel('part.back', s.H - 4, m.w - 4, 1, 'hardboard'));

  L.modules.forEach(m => {
    m.fronts
      .filter(f => f.key === 'part.drawerFront')
      .forEach(f =>
        P.item('part.drawer', msg('itemSize.drawer', { w: round(f.w), h: round(f.h), d: round(drawerDepth(s.D)) }), 1),
      );
    P.item('part.handle', msg('itemSize.handle'), m.fronts.length);
    P.item('part.hinge', msg('itemSize.hinge'), 2 * m.fronts.filter(f => f.key === 'part.door').length);
    if (m.type === 'sink') P.item('part.sink', msg('itemSize.sink', { w: round(m.w) }), 1);
  });
  const legs = L.modules.reduce((n, m) => n + legCount(m.legs), 0);
  if (legs) P.item('part.leg', msg('itemSize.leg', { h: round(s.legs) }), legs);
  return P.result();
}

function moduleMsg(s, m) {
  const f = m.fronts[0];
  switch (m.type) {
    case 'doors':
      return msg('describe.moduleDoors', { cnt: m.cnt, w: round(f.w), h: round(f.h) });
    case 'drawers':
      return msg('describe.moduleDrawers', { cnt: m.cnt, front: round(f.h) });
    case 'sink':
      return msg('describe.moduleSink', { cnt: m.cnt });
    case 'open':
      return msg('describe.moduleOpen', { cnt: m.cnt });
  }
  return null;
}

// Опис модулів: [{key, params, children}]
export function describe(s, L) {
  return L.modules.map(m => ({
    key: 'describe.module',
    params: { n: m.i + 1, w: round(m.w) },
    children: [moduleMsg(s, m)].filter(Boolean),
  }));
}

// Шапка CSV: [{label, value}]
export function summary(s, L) {
  const wt = L.worktop;
  return [
    { label: msg('export.overall'), value: `${round(wt.w)} × ${round(L.Htot)} × ${round(wt.d)}` },
    { label: msg('export.kitchenCarcass'), value: `${s.H} × ${s.D}` },
    { label: msg('export.legs'), value: s.legs },
    {
      label: msg('export.worktop'),
      value: msg('export.worktopValue', { t: wt.t, front: wt.front, left: wt.left, right: wt.right }),
    },
  ];
}
