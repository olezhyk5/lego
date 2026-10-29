import * as THREE from 'three';
import { T, GAP } from '../config/constants.js';
import { round } from '../utils/helpers.js';
import { drawerFront } from '../core/layout.js';
import { addLabel, addDim } from './annotations.js';
import { t } from '../i18n/index.js';

const ZONE_LABEL_STYLE = { bg: 'rgba(255,247,237,.95)', border: 'rgba(194,65,12,.35)', color: '#7c2d12' };

// Будує модель шафи. Повертає {model, dims}; dims — підгрупа з розмірами (вмикається окремо).
export function buildModel(s, L, { sel, showDims, M }) {
  const model = new THREE.Group();
  const dims = new THREE.Group();
  dims.visible = showDims;
  model.add(dims);
  model.position.set(-s.W / 2, 0, -s.D / 2);

  function box(w, h, d, x, y, z, mat, edges = true) {
    w = Math.max(w, 1);
    h = Math.max(h, 1);
    d = Math.max(d, 1);
    const g = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(g, mat);
    m.position.set(x + w / 2, y + h / 2, z + d / 2);
    model.add(m);
    if (edges) {
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(g), M.edge);
      e.position.copy(m.position);
      model.add(e);
    }
    return m;
  }

  // корпус
  box(T, s.H, s.D, 0, 0, 0, M.wood);
  box(T, s.H, s.D, s.W - T, 0, 0, M.wood);
  box(s.W - 2 * T, T, s.D, T, s.H - T, 0, M.wood);
  box(s.W - 2 * T, T, s.D, T, s.plinth, 0, M.wood);
  if (s.plinth > 0) box(s.W - 2 * T, s.plinth, T, T, 0, s.D - T - 30, M.wood);
  box(s.W, s.H, 3, 0, 0, -3, M.back);

  L.secs.forEach((c, idx) => {
    if (idx < L.secs.length - 1) box(T, L.Hin, s.D, c.x + c.w, L.y0, 0, M.wood);
    if (idx === sel && L.secs.length > 1) box(c.w, L.Hin, s.D + 2, c.x, L.y0, 0, M.hl, false);
    c.zones.forEach((z, j) => {
      if (j < c.zones.length - 1) box(c.w, T, s.D, c.x, z.bottom - T, 0, M.shelf);
      if (z.type === 'shelves') {
        const gap = (z.h - z.cnt * T) / (z.cnt + 1);
        for (let k = 0; k < z.cnt; k++) box(c.w, T, s.D - 20, c.x, z.bottom + gap * (k + 1) + T * k, 0, M.shelf);
      }
      if (z.type === 'rod' && c.w > 0) {
        const g = new THREE.CylinderGeometry(12, 12, Math.max(c.w, 1), 20);
        const m = new THREE.Mesh(g, M.rod);
        m.rotation.z = Math.PI / 2;
        m.position.set(c.x + c.w / 2, z.top - 60, s.D / 2);
        model.add(m);
      }
      if (z.type === 'drawers') {
        const fh = drawerFront(z.h, z.cnt);
        for (let k = 0; k < z.cnt; k++) {
          const y = z.bottom + GAP + (fh + GAP) * k;
          box(c.w - 2 * GAP, fh, 18, c.x + GAP, y, s.D - 18, M.front);
          const hw = Math.min(c.w * 0.35, 180);
          box(hw, 12, 18, c.x + c.w / 2 - hw / 2, y + fh * 0.62, s.D, M.handle, false);
        }
      }
    });
  });

  // розміри
  const lh = Math.max(s.W, s.H, s.D) / 42;
  const o = lh * 2.2;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  addDim(dims, M.dim, V(0, s.H + o * 2.1, s.D), V(s.W, s.H + o * 2.1, s.D), `${s.W}`, V(0, 1, 0), lh);
  if (L.secs.length > 1)
    L.secs.forEach(c =>
      addDim(dims, M.dim, V(c.x, s.H + o, s.D), V(c.x + c.w, s.H + o, s.D), `${round(c.w)}`, V(0, 1, 0), lh * 0.85),
    );
  addDim(dims, M.dim, V(-o, 0, s.D), V(-o, s.H, s.D), `${s.H}`, V(1, 0, 0), lh);
  addDim(dims, M.dim, V(s.W + o, 0, 0), V(s.W + o, 0, s.D), `${s.D}`, V(1, 0, 0), lh);
  if (s.plinth > 0)
    addDim(dims, M.dim, V(s.W + o, 0, s.D), V(s.W + o, s.plinth, s.D), `${s.plinth}`, V(1, 0, 0), lh * 0.75);

  L.secs.forEach(c =>
    c.zones.forEach(z => {
      const pos = V(c.x + c.w / 2, (z.top + z.bottom) / 2, s.D + 25);
      let lines;
      if (z.type === 'empty') lines = [`${round(z.h)}`];
      else if (z.type === 'shelves') lines = [t('viewer.label.shelves', { cnt: z.cnt }), `${round(z.h)}`];
      else if (z.type === 'rod') lines = [t('viewer.label.rod'), `${round(z.h)}`];
      else
        lines = [
          t('viewer.label.drawers', { cnt: z.cnt }),
          t('viewer.label.drawersFront', { front: round(drawerFront(z.h, z.cnt)) }),
        ];
      addLabel(dims, lines, pos, lh * 0.8, ZONE_LABEL_STYLE);
    }),
  );

  return { model, dims };
}
