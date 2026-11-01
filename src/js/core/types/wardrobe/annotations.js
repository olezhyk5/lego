import { round } from '../../../utils/helpers.js';
import { msg } from '../../common/msg.js';
import { drawerFront } from './layout.js';

// Розмірні лінії, підписи зон і підсвітка вибраної секції для 3D (формат — Annotations у core/types.js).
export function annotations(s, L, { sel }) {
  const lh = Math.max(s.W, s.H, s.D) / 42; // висота підпису, мм сцени
  const o = lh * 2.2; // відступ розмірних ліній від корпусу
  const dims = [];
  const dim = (from, to, text, tick, k) => dims.push({ from, to, text, tick, size: lh * k });
  const UP = [0, 1, 0],
    SIDE = [1, 0, 0];

  dim([0, s.H + o * 2.1, s.D], [s.W, s.H + o * 2.1, s.D], `${s.W}`, UP, 1);
  if (L.secs.length > 1)
    L.secs.forEach(c => dim([c.x, s.H + o, s.D], [c.x + c.w, s.H + o, s.D], `${round(c.w)}`, UP, 0.85));
  dim([-o, 0, s.D], [-o, s.H, s.D], `${s.H}`, SIDE, 1);
  dim([s.W + o, 0, 0], [s.W + o, 0, s.D], `${s.D}`, SIDE, 1);
  if (s.plinth > 0) dim([s.W + o, 0, s.D], [s.W + o, s.plinth, s.D], `${s.plinth}`, SIDE, 0.75);

  const labels = L.secs.flatMap(c =>
    c.zones.map(z => {
      let lines;
      if (z.type === 'empty') lines = [`${round(z.h)}`];
      else if (z.type === 'shelves') lines = [msg('viewer.label.shelves', { cnt: z.cnt }), `${round(z.h)}`];
      else if (z.type === 'rod') lines = [msg('viewer.label.rod'), `${round(z.h)}`];
      else
        lines = [
          msg('viewer.label.drawers', { cnt: z.cnt }),
          msg('viewer.label.drawersFront', { front: round(drawerFront(z.h, z.cnt)) }),
        ];
      return { lines, pos: [c.x + c.w / 2, (z.top + z.bottom) / 2, s.D + 25], size: lh * 0.8, style: 'zone' };
    }),
  );

  const selSec = L.secs[sel];
  const highlight =
    selSec && L.secs.length > 1 ? { x: selSec.x, y: L.y0, z: 0, w: selSec.w, h: L.Hin, d: s.D + 2 } : null;

  return { dims, labels, highlight };
}
