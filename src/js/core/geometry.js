import { T, GAP } from '../config/constants.js';
import { drawerFront } from './layout.js';

// Розміри, потрібні лише для моделі (у специфікації їх немає), мм
const BACK_T = 3; // товщина задньої стінки (ДВП)
const FRONT_T = 18; // товщина фасаду ящика
const PLINTH_SETBACK = 30; // відступ цоколя від передньої площини
const SHELF_SETBACK = 20; // полиці коротші за глибину корпусу
const ROD_R = 12; // радіус штанги
const ROD_DROP = 60; // штанга нижче верху зони
const HANDLE_H = 12;
const HANDLE_MAX_W = 180;
const HANDLE_W_RATIO = 0.35; // ширина ручки від ширини секції

// Геометрія моделі без Three.js, у мм: з неї будує 3D viewer/ і робитимуть експорт (SketchUp, DXF…).
// Координати: x — від лівої зовнішньої площини корпусу, y — від підлоги, z — від задньої площини
// корпусу до фасаду (z = D). Задня стінка й виступи кришки можуть виходити за 0…W / 0…D.
//   boxes — {key, x, y, z, w, h, d}: прямокутна деталь, (x, y, z) — її мінімальний кут;
//   rods  — {key, x, y, z, len, r}: циліндр уздовж x від x до x + len, (y, z) — його вісь.
// key — ключ деталі (part.*), той самий, що в специфікації.
export function modelGeometry(s, L) {
  const boxes = [],
    rods = [];
  const box = (key, x, y, z, w, h, d) => boxes.push({ key, x, y, z, w, h, d });

  // корпус
  const { sideH, topW, topX, topT, topD, topZ, backH } = L.carcass;
  box('part.side', 0, 0, 0, T, sideH, s.D);
  box('part.side', s.W - T, 0, 0, T, sideH, s.D);
  box('part.top', topX, s.H - topT, topZ, topW, topT, topD);
  box('part.bottom', T, s.plinth, 0, s.W - 2 * T, T, s.D);
  if (s.plinth > 0) box('part.plinth', T, 0, s.D - T - PLINTH_SETBACK, s.W - 2 * T, s.plinth, T);
  box('part.back', 0, 0, -BACK_T, s.W, backH + 4, BACK_T);

  L.secs.forEach((c, idx) => {
    if (idx < L.secs.length - 1) box('part.divider', c.x + c.w, L.y0, 0, T, L.Hin, s.D);
    c.zones.forEach((z, j) => {
      if (j < c.zones.length - 1) box('part.zoneShelf', c.x, z.bottom - T, 0, c.w, T, s.D);
      if (z.type === 'shelves') {
        const gap = (z.h - z.cnt * T) / (z.cnt + 1);
        for (let k = 0; k < z.cnt; k++)
          box('part.shelf', c.x, z.bottom + gap * (k + 1) + T * k, 0, c.w, T, s.D - SHELF_SETBACK);
      }
      if (z.type === 'rod' && c.w > 0)
        rods.push({ key: 'part.rod', x: c.x, y: z.top - ROD_DROP, z: s.D / 2, len: c.w, r: ROD_R });
      if (z.type === 'drawers') {
        const fh = drawerFront(z.h, z.cnt);
        const hw = Math.min(c.w * HANDLE_W_RATIO, HANDLE_MAX_W);
        for (let k = 0; k < z.cnt; k++) {
          const y = z.bottom + GAP + (fh + GAP) * k;
          box('part.drawerFront', c.x + GAP, y, s.D - FRONT_T, c.w - 2 * GAP, fh, FRONT_T);
          box('part.handle', c.x + c.w / 2 - hw / 2, y + fh * 0.62, s.D, hw, HANDLE_H, FRONT_T);
        }
      }
    });
  });

  return { boxes, rods };
}
