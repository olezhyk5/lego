import { T, GAP } from '../../../config/constants.js';
import { geometryBuilder, thickness } from '../../common/geometry-builder.js';
import { addCarcassGeometry, plinthZ } from '../../common/carcass.js';
import { addLegGeometry } from '../../common/legs.js';
import { drawerFront } from './layout.js';

// Розміри, потрібні лише для моделі (у специфікації їх немає), мм
const SHELF_SETBACK = 20; // полиці коротші за глибину корпусу
const ROD_R = 12; // радіус штанги
const ROD_DROP = 60; // штанга нижче верху зони
const HANDLE_H = 12;
const HANDLE_D = 18; // виліт ручки від фасаду
const HANDLE_MAX_W = 180;
const HANDLE_W_RATIO = 0.35; // ширина ручки від ширини секції

// Геометрія моделі без Three.js, у мм: з неї будує 3D viewer/ і робитимуть експорт (SketchUp, DXF…).
// Формат і координати — Geometry у core/types.js.
export function modelGeometry(s, L) {
  const G = geometryBuilder();
  addCarcassGeometry(G, s, L.carcass);
  if (L.legs.length) addLegGeometry(G, L.legs, s.plinth, plinthZ(s));

  L.secs.forEach((c, idx) => {
    if (idx < L.secs.length - 1) G.panel('part.divider', 'wood', c.x + c.w, L.y0, 0, T, L.Hin, s.D);
    c.zones.forEach((z, j) => {
      if (j < c.zones.length - 1) G.panel('part.zoneShelf', 'shelf', c.x, z.bottom - T, 0, c.w, T, s.D);
      if (z.type === 'shelves') {
        const gap = (z.h - z.cnt * T) / (z.cnt + 1);
        for (let k = 0; k < z.cnt; k++)
          G.panel('part.shelf', 'shelf', c.x, z.bottom + gap * (k + 1) + T * k, 0, c.w, T, s.D - SHELF_SETBACK);
      }
      if (z.type === 'rod' && c.w > 0) G.rod('part.rod', 'rod', c.x, z.top - ROD_DROP, s.D / 2, c.w, ROD_R);
      if (z.type === 'drawers') {
        const fh = drawerFront(z.h, z.cnt);
        const frontT = thickness(); // фасад з ДСП, як у специфікації
        const hw = Math.min(c.w * HANDLE_W_RATIO, HANDLE_MAX_W);
        for (let k = 0; k < z.cnt; k++) {
          const y = z.bottom + GAP + (fh + GAP) * k;
          G.panel('part.drawerFront', 'front', c.x + GAP, y, s.D - frontT, c.w - 2 * GAP, fh, frontT);
          G.hardware('part.handle', 'handle', c.x + c.w / 2 - hw / 2, y + fh * 0.62, s.D, hw, HANDLE_H, HANDLE_D);
        }
      }
    });
  });

  return G.result();
}
