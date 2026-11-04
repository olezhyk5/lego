import { T, GAP } from '../../../config/constants.js';
import { thickness } from '../../common/geometry-builder.js';
import { LEG, LEG_INSET } from '../../common/legs.js';
import { RAIL_W, PLINTH_SETBACK } from './constants.js';
import { SHELF_SETBACK } from './corner.js';

const BACK_INSET = 2;
const HANDLE = { len: 128, h: 12, d: 18, fromTop: 60 };

export const L_SHAPE_LEGS = 6;

// Ніжки Г-подібного модуля: на кінцях обох плечей і у внутрішньому куті
const lShapeLegs = (s, c) => {
  const front = s.D - PLINTH_SETBACK - T - LEG - 10;
  return [
    [c.x + LEG, LEG_INSET],
    [c.x + LEG, front],
    [c.end - LEG_INSET - LEG, LEG_INSET],
    [c.end - front - LEG, front],
    [c.end - LEG_INSET - LEG, c.b - 2 * LEG],
    [c.end - front - LEG, c.b - 2 * LEG],
  ];
};

/**
 * Г-подібний модуль у координатах стіни, на якій він стоїть: другий бік іде в +z.
 * Дно й полиці — заготовки a × b з вирізом (notch) у внутрішньому куті.
 * @param {any} G збирач у координатах стіни (placedBuilder)
 * @param {any} s проєкт
 * @param {any} c розрахунок модуля (layoutCorner)
 */
export function addLShapeGeometry(G, s, c) {
  const { x, end, a, b, y0 } = c;
  const yTop = y0 + s.H;
  const left = x + T;
  const blankA = a - T;
  const blankB = b - T;
  const backT = thickness('hardboard');
  G.panel('part.side', 'wood', x, y0, 0, T, s.H, s.D);
  G.panel('part.side', 'wood', end - s.D, y0, b - T, s.D, s.H, T);
  const notch = setback => ({
    x: left,
    z: s.D - setback,
    w: blankA - s.D + setback,
    d: blankB - s.D + setback,
  });
  G.panel('part.bottom', 'wood', left, y0, 0, blankA, T, blankB, undefined, [], notch(0));
  c.shelves.forEach(y =>
    G.panel('part.shelf', 'shelf', left, y, 0, blankA, T, blankB, undefined, [], notch(SHELF_SETBACK)),
  );
  const railY = yTop - T;
  G.panel('part.rail', 'wood', left, railY, 0, a - T, T, RAIL_W);
  G.panel('part.rail', 'wood', end - RAIL_W, railY, RAIL_W, RAIL_W, T, b - T - RAIL_W);
  G.panel('part.rail', 'wood', left, railY, s.D - RAIL_W, a - T - s.D, T, RAIL_W);
  G.panel('part.rail', 'wood', end - s.D, railY, s.D - RAIL_W, RAIL_W, T, b - T - s.D + RAIL_W);
  G.panel('part.back', 'back', x + BACK_INSET, y0 + BACK_INSET, -backT, a - 4, s.H - 4, backT, 'hardboard');
  G.panel('part.back', 'back', end, y0 + BACK_INSET, BACK_INSET, backT, s.H - 4, b - 4, 'hardboard');
  c.doors.forEach(d => G.panel('part.door', 'front', d.x, y0 + GAP, d.z, d.w, c.doorH, d.d));
  // одна ручка — на другій дверці, біля вільного краю
  const [, door] = c.doors;
  const len = Math.min(HANDLE.len, door.d * 0.6);
  G.hardware(
    'part.handle',
    'handle',
    door.x - HANDLE.d,
    y0 + GAP + c.doorH - HANDLE.fromTop,
    door.z + door.d - len - 20,
    HANDLE.d,
    HANDLE.h,
    len,
  );
  if (s.legs > 0) lShapeLegs(s, c).forEach(([lx, lz]) => G.hardware('part.leg', 'handle', lx, 0, lz, LEG, s.legs, LEG));
}
