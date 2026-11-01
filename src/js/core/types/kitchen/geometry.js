import { T } from '../../../config/constants.js';
import { geometryBuilder, thickness } from '../../common/geometry-builder.js';
import { RAIL_W, LEG, LEG_INSET } from './constants.js';

// Розміри, потрібні лише для моделі (у специфікації їх немає), мм
const SHELF_SETBACK = 20;
const BACK_INSET = 2;
const PLINTH_SETBACK = 50; // цокольна планка відступає від фасадів
const HANDLE = { w: 128, h: 12, d: 18, fromTop: 60 };
const SINK_MARGIN = { side: 100, back: 60, front: 90 }; // контур мийки на стільниці від країв модуля

// Геометрія кухні без Three.js, у мм; формат і координати — Geometry у core/types.js.
export function modelGeometry(s, L) {
  const G = geometryBuilder();
  const y0 = L.y0,
    yTop = y0 + s.H;
  const backT = thickness('hardboard');

  L.modules.forEach(m => {
    const x = m.x,
      inner = m.w - 2 * T;
    G.panel('part.side', 'wood', x, y0, 0, T, s.H, s.D);
    G.panel('part.side', 'wood', x + m.w - T, y0, 0, T, s.H, s.D);
    G.panel('part.bottom', 'wood', x + T, y0, 0, inner, T, s.D);
    // царги під стільницею: задня й передня
    G.panel('part.rail', 'wood', x + T, yTop - T, 0, inner, T, RAIL_W);
    G.panel('part.rail', 'wood', x + T, yTop - T, s.D - RAIL_W, inner, T, RAIL_W);
    m.shelves.forEach(y => G.panel('part.shelf', 'shelf', x + T, y, 0, inner, T, s.D - SHELF_SETBACK));
    G.panel('part.back', 'back', x + BACK_INSET, y0 + BACK_INSET, -backT, m.w - 4, s.H - 4, backT, 'hardboard');

    // накладні фасади перед корпусом; ручка — біля верхнього краю, по центру
    m.fronts.forEach(f => {
      G.panel(f.key, 'front', f.x, f.y, s.D, f.w, f.h, T);
      const hw = Math.min(HANDLE.w, f.w * 0.6);
      const hy = f.key === 'part.door' ? f.y + f.h - HANDLE.fromTop : f.y + f.h * 0.62;
      G.hardware('part.handle', 'handle', f.x + f.w / 2 - hw / 2, hy, s.D + T, hw, HANDLE.h, HANDLE.d);
    });

    // ряди ніжок — з layout; у ряду задня й передня (за цокольною планкою)
    m.legs.forEach(lx =>
      [LEG_INSET, s.D - PLINTH_SETBACK - T - LEG - 10].forEach(lz =>
        G.hardware('part.leg', 'handle', lx, 0, lz, LEG, s.legs, LEG),
      ),
    );

    if (m.type === 'sink') {
      const sw = Math.max(m.w - 2 * SINK_MARGIN.side, 1);
      G.hardware('part.sink', 'handle', x + SINK_MARGIN.side, yTop + L.worktop.t, SINK_MARGIN.back, sw, 2, s.D - 150);
    }
  });

  if (s.legs > 0) G.panel('part.plinth', 'wood', 0, 0, s.D - PLINTH_SETBACK - T, L.W, s.legs, T);
  const wt = L.worktop;
  G.panel('part.worktop', 'worktop', wt.x, yTop, 0, wt.w, wt.t, wt.d, 'worktop');

  return G.result();
}
