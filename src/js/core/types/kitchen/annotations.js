import { round } from '../../../utils/helpers.js';
import { msg } from '../../common/msg.js';

// Розмірні лінії, підписи модулів і підсвітка вибраного модуля (формат — Annotations у core/types.js).
export function annotations(s, L, { sel }) {
  const { W: bw, H: bh, D: bd } = L.bounds;
  const wt = L.worktop;
  const lh = Math.max(bw, bh, bd) / 42;
  const o = lh * 2.2;
  const dims = [];
  const dim = (from, to, text, tick, k) => dims.push({ from, to, text, tick, size: lh * k });
  const UP = [0, 1, 0],
    SIDE = [1, 0, 0];

  dim([wt.x, bh + o * 2.1, bd], [wt.x + wt.w, bh + o * 2.1, bd], `${round(wt.w)}`, UP, 1);
  if (L.modules.length > 1)
    L.modules.forEach(m => dim([m.x, bh + o, bd], [m.x + m.w, bh + o, bd], `${round(m.w)}`, UP, 0.85));
  dim([wt.x - o, 0, bd], [wt.x - o, bh, bd], `${round(bh)}`, SIDE, 1);
  const xr = wt.x + wt.w + o;
  dim([xr, 0, 0], [xr, 0, bd], `${round(bd)}`, SIDE, 1);
  if (s.legs > 0) dim([xr, 0, bd], [xr, s.legs, bd], `${s.legs}`, SIDE, 0.75);

  const labels = L.modules.map(m => ({
    lines: [msg(`viewer.label.module.${m.type}`, { cnt: m.cnt }), `${round(m.w)}`],
    pos: [m.x + m.w / 2, L.y0 + s.H / 2, s.D + 40],
    size: lh * 0.8,
    style: 'zone',
  }));

  const m = L.modules[sel];
  const highlight = m && L.modules.length > 1 ? { x: m.x, y: L.y0, z: 0, w: m.w, h: s.H, d: s.D + 2 } : null;

  return { dims, labels, highlight };
}
