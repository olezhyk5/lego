import * as THREE from 'three';
import { round } from '../utils/helpers.js';
import { drawerFront } from '../core/layout.js';
import { modelGeometry } from '../core/geometry.js';
import { addLabel, addDim } from './annotations.js';
import { t } from '../i18n/index.js';

// Матеріал 3D за ключем деталі
const LOOK = {
  'part.side': 'wood',
  'part.top': 'wood',
  'part.bottom': 'wood',
  'part.plinth': 'wood',
  'part.divider': 'wood',
  'part.back': 'back',
  'part.zoneShelf': 'shelf',
  'part.shelf': 'shelf',
  'part.drawerFront': 'front',
  'part.handle': 'handle',
};

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

  const { boxes, rods } = modelGeometry(s, L);
  boxes.forEach(b => box(b.w, b.h, b.d, b.x, b.y, b.z, M[LOOK[b.key]], b.key !== 'part.handle'));
  rods.forEach(r => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r.r, r.r, Math.max(r.len, 1), 20), M.rod);
    m.rotation.z = Math.PI / 2;
    m.position.set(r.x + r.len / 2, r.y, r.z);
    model.add(m);
  });

  // підсвітка вибраної секції
  const selSec = L.secs[sel];
  if (selSec && L.secs.length > 1) box(selSec.w, L.Hin, s.D + 2, selSec.x, L.y0, 0, M.hl, false);

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
