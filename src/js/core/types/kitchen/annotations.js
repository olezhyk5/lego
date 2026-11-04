import { round } from '../../../utils/helpers.js';
import { msg } from '../../common/msg.js';
import { placeDir, placePoint, placeRect } from './walls.js';

const LABEL_OUT = 40; // підпис перед фасадом, мм

// Розмірні лінії, підписи модулів і підсвітка вибраного модуля (формат — Annotations у core/types.js).
export function annotations(s, L, { sel, wall: selWall = 0, tier = 'base' }) {
  const { W: bw, H: bh, D: bd } = L.bounds;
  const lh = Math.max(bw, bh, bd) / 42;
  const o = lh * 2.2;
  const dims = [];
  const labels = [];
  const UP = [0, 1, 0],
    SIDE = [1, 0, 0];

  L.walls.forEach((wall, k) => {
    const dim = (from, to, text, tick, size) =>
      dims.push({
        from: placePoint(wall.place, from),
        to: placePoint(wall.place, to),
        text,
        tick: placeDir(wall.place, tick),
        size: lh * size,
      });
    const { x0, x1, d } = wall.extent;
    dim([x0, bh + o * 2.1, d], [x1, bh + o * 2.1, d], `${round(x1 - x0)}`, UP, 1);
    if (wall.modules.length > 1)
      wall.modules.forEach(m => dim([m.x, bh + o, d], [m.x + m.w, bh + o, d], `${round(m.w)}`, UP, 0.85));
    if (k === 0) dim([x0 - o, 0, d], [x0 - o, bh, d], `${round(bh)}`, SIDE, 1);
    if (k === L.walls.length - 1) {
      const xr = x1 + o;
      dim([xr, 0, 0], [xr, 0, d], `${round(d)}`, SIDE, 1);
      if (s.legs > 0) dim([xr, 0, d], [xr, s.legs, d], `${s.legs}`, SIDE, 0.75);
    }
    const label = (lines, x, y, z) =>
      labels.push({ lines, pos: placePoint(wall.place, [x, y, z]), size: lh * 0.8, style: 'zone' });
    wall.modules.forEach(m =>
      label(
        [msg(`viewer.label.module.${m.type}`, { cnt: m.cnt }), `${round(m.niche ? m.niche.w : m.w)}`],
        m.x + m.w / 2,
        m.y0 + m.h / 2,
        m.depth + LABEL_OUT,
      ),
    );
    if (wall.corner) {
      const c = wall.corner;
      label(
        [msg(`viewer.label.module.${c.type}`), `${round(c.len)}`],
        c.x + (c.type === 'blind' ? c.fronts[0].w : c.a - s.D) / 2,
        c.y0 + c.h / 2,
        c.depth + LABEL_OUT,
      );
    }
    wall.uppers
      .filter(m => m.type !== 'gap')
      .forEach(m =>
        label(
          [msg(`viewer.label.module.${m.type}`, { cnt: m.cnt }), `${round(m.w)}`],
          m.x + m.w / 2,
          m.y0 + m.h / 2,
          m.depth + LABEL_OUT,
        ),
      );
  });

  const wall = L.walls[selWall] || L.walls[0];
  const m = (tier === 'upper' ? wall.uppers : wall.modules)[sel];
  const total = L.modules.length + L.uppers.length;
  if (!m || total < 2) return { dims, labels, highlight: null };
  const q = placeRect(wall.place, { x: m.x, z: 0, w: m.w, d: m.depth + 2 });
  return { dims, labels, highlight: { x: q.x, y: m.y0, z: q.z, w: q.w, h: m.h, d: q.d } };
}
